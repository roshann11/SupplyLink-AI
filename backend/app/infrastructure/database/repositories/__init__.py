from datetime import datetime
from uuid import UUID

from sqlalchemy import select, or_, and_, func, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.domain.models import Company, RefreshToken, User, Product, RFQ, Quote, Message, Review
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


class ProductRepository(BaseRepository[Product]):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session, Product)

    async def list_by_company(self, company_id: UUID, *, offset: int = 0, limit: int = 20) -> list[Product]:
        stmt = select(Product).where(Product.company_id == company_id).offset(offset).limit(limit)
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def list_active(self, *, offset: int = 0, limit: int = 20) -> list[Product]:
        stmt = select(Product).where(Product.is_active == True).offset(offset).limit(limit)
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def get_by_id_for_company(self, entity_id: UUID, company_id: UUID) -> Product | None:
        stmt = select(Product).where(Product.id == entity_id, Product.company_id == company_id)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()


class RFQRepository(BaseRepository[RFQ]):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session, RFQ)

    async def list_by_company(self, company_id: UUID, *, offset: int = 0, limit: int = 20) -> list[RFQ]:
        stmt = select(RFQ).where(RFQ.company_id == company_id).offset(offset).limit(limit)
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def list_active_open(self, *, offset: int = 0, limit: int = 20) -> list[RFQ]:
        from app.domain.enums import RFQStatus
        stmt = select(RFQ).where(RFQ.status == RFQStatus.OPEN).offset(offset).limit(limit)
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def get_by_id_for_company(self, entity_id: UUID, company_id: UUID) -> RFQ | None:
        stmt = select(RFQ).where(RFQ.id == entity_id, RFQ.company_id == company_id)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()


class QuoteRepository(BaseRepository[Quote]):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session, Quote)

    async def list_by_rfq(self, rfq_id: UUID) -> list[Quote]:
        stmt = select(Quote).where(Quote.rfq_id == rfq_id)
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def list_by_company(self, company_id: UUID) -> list[Quote]:
        stmt = select(Quote).where(Quote.company_id == company_id)
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def get_by_id_for_company(self, entity_id: UUID, company_id: UUID) -> Quote | None:
        stmt = select(Quote).where(Quote.id == entity_id, Quote.company_id == company_id)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()


class MessageRepository(BaseRepository[Message]):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session, Message)

    async def get_chat_history(self, user_a: UUID, user_b: UUID, *, limit: int = 50) -> list[Message]:
        stmt = (
            select(Message)
            .where(
                or_(
                    and_(Message.sender_id == user_a, Message.receiver_id == user_b),
                    and_(Message.sender_id == user_b, Message.receiver_id == user_a),
                )
            )
            .order_by(Message.created_at.asc())
            .limit(limit)
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def get_active_conversations(self, user_id: UUID) -> list[UUID]:
        stmt_senders = select(Message.receiver_id).where(Message.sender_id == user_id).distinct()
        stmt_receivers = select(Message.sender_id).where(Message.receiver_id == user_id).distinct()
        
        result_senders = await self.session.execute(stmt_senders)
        result_receivers = await self.session.execute(stmt_receivers)
        
        uids = set(result_senders.scalars().all()) | set(result_receivers.scalars().all())
        return list(uids)

    async def mark_as_read(self, sender_id: UUID, receiver_id: UUID) -> None:
        stmt = (
            update(Message)
            .where(Message.sender_id == sender_id, Message.receiver_id == receiver_id, Message.read_at.is_(None))
            .values(read_at=datetime.utcnow())
        )
        await self.session.execute(stmt)

    async def get_by_id_for_company(self, entity_id: UUID, company_id: UUID) -> Message | None:
        return await self.get_by_id(entity_id)


class ReviewRepository(BaseRepository[Review]):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session, Review)

    async def list_for_company(self, company_id: UUID) -> list[Review]:
        stmt = select(Review).where(Review.company_id == company_id)
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def get_average_rating(self, company_id: UUID) -> float:
        stmt = select(func.avg(Review.rating)).where(Review.company_id == company_id)
        result = await self.session.execute(stmt)
        val = result.scalar()
        return float(val) if val is not None else 0.0

    async def get_by_id_for_company(self, entity_id: UUID, company_id: UUID) -> Review | None:
        stmt = select(Review).where(Review.id == entity_id, Review.company_id == company_id)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()
