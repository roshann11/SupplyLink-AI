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
from app.services.company_service import CompanyService
from app.services.product_service import ProductService
from app.services.rfq_service import RFQService
from app.services.message_service import MessageService
from app.services.review_service import ReviewService

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


async def get_company_service(
    db: Annotated[AsyncSession, Depends(get_db)],
) -> CompanyService:
    return CompanyService(db)


async def get_product_service(
    db: Annotated[AsyncSession, Depends(get_db)],
) -> ProductService:
    return ProductService(db)


async def get_rfq_service(
    db: Annotated[AsyncSession, Depends(get_db)],
) -> RFQService:
    return RFQService(db)


async def get_message_service(
    db: Annotated[AsyncSession, Depends(get_db)],
) -> MessageService:
    return MessageService(db)


async def get_review_service(
    db: Annotated[AsyncSession, Depends(get_db)],
) -> ReviewService:
    return ReviewService(db)
