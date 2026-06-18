from typing import Annotated
from uuid import UUID

from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import UnauthorizedError
from app.core.security import decode_token
from app.domain.enums import UserRole
from app.infrastructure.database.session import get_db
from app.schemas.auth import UserResponse
from app.services.auth_service import AuthService

security = HTTPBearer(auto_error=False)


async def get_auth_service(
    db: Annotated[AsyncSession, Depends(get_db)],
) -> AuthService:
    return AuthService(db)


async def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(security)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
) -> UserResponse:
    if credentials is None:
        raise UnauthorizedError()

    try:
        payload = decode_token(credentials.credentials)
    except ValueError as exc:
        raise UnauthorizedError() from exc

    if payload.get("type") != "access":
        raise UnauthorizedError("Invalid token type")

    subject = payload.get("sub")
    if not subject:
        raise UnauthorizedError()

    return await auth_service.get_current_user(UUID(subject))


def require_roles(*roles: UserRole):
    async def _checker(current_user: Annotated[UserResponse, Depends(get_current_user)]) -> UserResponse:
        if current_user.role not in roles:
            from app.core.exceptions import ForbiddenError

            raise ForbiddenError()
        return current_user

    return _checker
