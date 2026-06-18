from datetime import datetime
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.domain.models import Company, RefreshToken, User
from app.domain.repositories.base import BaseRepository


class CompanyRepository(BaseRepository[Company]):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session, Company)

    async def get_by_slug(self, slug: str) -> Company | None:
        stmt = select(Company).where(Company.slug == slug)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_id_for_company(self, entity_id: UUID, company_id: UUID) -> Company | None:
        if entity_id != company_id:
            return None
        return await self.get_by_id(entity_id)


class UserRepository(BaseRepository[User]):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session, User)

    async def get_by_email(self, email: str) -> User | None:
        stmt = (
            select(User)
            .options(selectinload(User.company))
            .where(User.email == email)
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_with_company(self, user_id: UUID) -> User | None:
        stmt = select(User).options(selectinload(User.company)).where(User.id == user_id)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_id_for_company(self, entity_id: UUID, company_id: UUID) -> User | None:
        stmt = select(User).where(User.id == entity_id, User.company_id == company_id)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()


class RefreshTokenRepository(BaseRepository[RefreshToken]):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session, RefreshToken)

    async def get_by_jti(self, jti: str) -> RefreshToken | None:
        stmt = select(RefreshToken).where(RefreshToken.jti == jti)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def revoke(self, token: RefreshToken) -> None:
        token.revoked_at = datetime.now()
        await self.session.flush()

    async def get_by_id_for_company(self, entity_id: UUID, company_id: UUID) -> RefreshToken | None:
        return await self.get_by_id(entity_id)
