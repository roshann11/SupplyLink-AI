import re
import uuid
from datetime import UTC, datetime, timedelta

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ConflictError, UnauthorizedError
from app.config import settings
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    verify_password,
)
from app.domain.enums import UserRole
from app.domain.models import Company, RefreshToken, User
from app.infrastructure.database.repositories import (
    CompanyRepository,
    RefreshTokenRepository,
    UserRepository,
)
from app.schemas.auth import LoginRequest, RegisterRequest, TokenResponse, UserResponse


def _slugify(value: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")
    return slug or "company"


class AuthService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.users = UserRepository(session)
        self.companies = CompanyRepository(session)
        self.refresh_tokens = RefreshTokenRepository(session)

    async def register(self, payload: RegisterRequest) -> UserResponse:
        if await self.users.get_by_email(payload.email):
            raise ConflictError("Email already registered")

        if payload.role == UserRole.ADMIN:
            raise UnauthorizedError("Admin accounts cannot be self-registered")

        base_slug = _slugify(payload.company_name)
        slug = base_slug
        suffix = 1
        while await self.companies.get_by_slug(slug):
            slug = f"{base_slug}-{suffix}"
            suffix += 1

        company = Company(
            name=payload.company_name,
            slug=slug,
            company_type=payload.company_type,
        )
        await self.companies.add(company)

        user = User(
            company_id=company.id,
            email=payload.email,
            password_hash=hash_password(payload.password),
            first_name=payload.first_name,
            last_name=payload.last_name,
            role=payload.role,
        )
        await self.users.add(user)

        user_with_company = await self.users.get_with_company(user.id)
        assert user_with_company is not None
        return UserResponse.model_validate(user_with_company)

    async def login(self, payload: LoginRequest) -> TokenResponse:
        user = await self.users.get_by_email(payload.email)
        if not user or not verify_password(payload.password, user.password_hash):
            raise UnauthorizedError("Invalid email or password")
        if not user.is_active:
            raise UnauthorizedError("Account is inactive")

        user.last_login_at = datetime.now(UTC)
        await self.session.flush()

        return await self._issue_tokens(user)

    async def refresh(self, refresh_token: str) -> TokenResponse:
        try:
            payload = decode_token(refresh_token)
        except ValueError as exc:
            raise UnauthorizedError("Invalid refresh token") from exc

        if payload.get("type") != "refresh":
            raise UnauthorizedError("Invalid token type")

        jti = payload.get("jti")
        user_id = payload.get("sub")
        if not jti or not user_id:
            raise UnauthorizedError("Invalid refresh token")

        stored = await self.refresh_tokens.get_by_jti(jti)
        if not stored or stored.revoked_at is not None:
            raise UnauthorizedError("Refresh token revoked or not found")
        if stored.expires_at < datetime.now(UTC):
            raise UnauthorizedError("Refresh token expired")

        user = await self.users.get_with_company(uuid.UUID(user_id))
        if not user or not user.is_active:
            raise UnauthorizedError("User not found or inactive")

        await self.refresh_tokens.revoke(stored)
        return await self._issue_tokens(user)

    async def logout(self, refresh_token: str) -> None:
        try:
            payload = decode_token(refresh_token)
        except ValueError:
            return

        jti = payload.get("jti")
        if not jti:
            return

        stored = await self.refresh_tokens.get_by_jti(jti)
        if stored and stored.revoked_at is None:
            await self.refresh_tokens.revoke(stored)

    async def get_current_user(self, user_id: uuid.UUID) -> UserResponse:
        user = await self.users.get_with_company(user_id)
        if not user or not user.is_active:
            raise UnauthorizedError("User not found or inactive")
        return UserResponse.model_validate(user)

    async def _issue_tokens(self, user: User) -> TokenResponse:
        jti = uuid.uuid4().hex
        expires_at = datetime.now(UTC) + timedelta(days=settings.refresh_token_expire_days)

        refresh_record = RefreshToken(
            user_id=user.id,
            jti=jti,
            expires_at=expires_at,
        )
        await self.refresh_tokens.add(refresh_record)

        access_token = create_access_token(
            str(user.id),
            extra_claims={
                "role": user.role.value,
                "company_id": str(user.company_id),
            },
        )
        refresh_token = create_refresh_token(str(user.id), jti)

        return TokenResponse(access_token=access_token, refresh_token=refresh_token)
