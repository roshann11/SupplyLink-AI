from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.exceptions import NotFoundError, ForbiddenError, ConflictError
from app.domain.enums import RFQStatus, QuoteStatus
from app.domain.models import RFQ, Quote
from app.infrastructure.database.repositories import RFQRepository, QuoteRepository
from app.schemas.rfq import RFQCreate, RFQResponse, QuoteCreate, QuoteResponse
from sqlalchemy import select
from sqlalchemy.orm import selectinload


class RFQService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.rfqs = RFQRepository(session)
        self.quotes = QuoteRepository(session)

    async def create_rfq(self, company_id: UUID, user_id: UUID, payload: RFQCreate) -> RFQResponse:
        rfq = RFQ(
            company_id=company_id,
            created_by_id=user_id,
            title=payload.title,
            description=payload.description,
            quantity=payload.quantity,
            target_price=payload.target_price,
            expires_at=payload.expires_at,
            status=RFQStatus.OPEN,
        )
        await self.rfqs.add(rfq)
        return RFQResponse.model_validate(rfq)

    async def list_my_rfqs(self, company_id: UUID, *, offset: int = 0, limit: int = 20) -> list[RFQResponse]:
        # Preload quotes
        stmt = (
            select(RFQ)
            .options(selectinload(RFQ.quotes))
            .where(RFQ.company_id == company_id)
            .offset(offset)
            .limit(limit)
        )
        res = await self.session.execute(stmt)
        rfqs = res.scalars().all()
        return [RFQResponse.model_validate(r) for r in rfqs]

    async def list_active_open_rfqs(self, *, offset: int = 0, limit: int = 20) -> list[RFQResponse]:
        stmt = (
            select(RFQ)
            .options(selectinload(RFQ.quotes))
            .where(RFQ.status == RFQStatus.OPEN)
            .offset(offset)
            .limit(limit)
        )
        res = await self.session.execute(stmt)
        rfqs = res.scalars().all()
        return [RFQResponse.model_validate(r) for r in rfqs]

    async def get_rfq_details(self, rfq_id: UUID) -> RFQResponse:
        stmt = select(RFQ).options(selectinload(RFQ.quotes)).where(RFQ.id == rfq_id)
        res = await self.session.execute(stmt)
        rfq = res.scalar_one_or_none()
        if not rfq:
            raise NotFoundError("RFQ")
        return RFQResponse.model_validate(rfq)

    async def submit_quote(self, rfq_id: UUID, company_id: UUID, user_id: UUID, payload: QuoteCreate) -> QuoteResponse:
        rfq = await self.rfqs.get_by_id(rfq_id)
        if not rfq:
            raise NotFoundError("RFQ")
        if rfq.company_id == company_id:
            raise ConflictError("You cannot submit a quote for your own RFQ")
        if rfq.status != RFQStatus.OPEN:
            raise ConflictError("This RFQ is not open for bidding")

        # Check if already bid
        bid_stmt = select(Quote).where(Quote.rfq_id == rfq_id, Quote.company_id == company_id)
        bid_res = await self.session.execute(bid_stmt)
        existing = bid_res.scalar_one_or_none()
        if existing:
            raise ConflictError("You have already submitted a quote for this RFQ")

        quote = Quote(
            rfq_id=rfq_id,
            company_id=company_id,
            created_by_id=user_id,
            price=payload.price,
            lead_time_days=payload.lead_time_days,
            notes=payload.notes,
            status=QuoteStatus.PENDING,
        )
        await self.quotes.add(quote)
        return QuoteResponse.model_validate(quote)

    async def list_rfq_quotes(self, rfq_id: UUID, company_id: UUID) -> list[QuoteResponse]:
        rfq = await self.rfqs.get_by_id(rfq_id)
        if not rfq:
            raise NotFoundError("RFQ")
        
        # Only the buyer company (creator) or bidding suppliers should be allowed to view quotes.
        # For simplicity, if caller is buyer, show all quotes. If caller is supplier, only show their quote.
        if rfq.company_id == company_id:
            quotes = await self.quotes.list_by_rfq(rfq_id)
            return [QuoteResponse.model_validate(q) for q in quotes]
        else:
            stmt = select(Quote).where(Quote.rfq_id == rfq_id, Quote.company_id == company_id)
            res = await self.session.execute(stmt)
            q = res.scalar_one_or_none()
            if not q:
                return []
            return [QuoteResponse.model_validate(q)]

    async def award_quote(self, rfq_id: UUID, quote_id: UUID, company_id: UUID) -> RFQResponse:
        stmt = select(RFQ).options(selectinload(RFQ.quotes)).where(RFQ.id == rfq_id)
        res = await self.session.execute(stmt)
        rfq = res.scalar_one_or_none()
        if not rfq:
            raise NotFoundError("RFQ")
        if rfq.company_id != company_id:
            raise ForbiddenError("Only the creator of the RFQ can award quotes")
        if rfq.status != RFQStatus.OPEN:
            raise ConflictError("This RFQ is not open")

        target_quote = None
        for q in rfq.quotes:
            if q.id == quote_id:
                target_quote = q
                break

        if not target_quote:
            raise NotFoundError("Quote")

        # Award the target quote and reject all other pending quotes
        rfq.status = RFQStatus.AWARDED
        for q in rfq.quotes:
            if q.id == quote_id:
                q.status = QuoteStatus.ACCEPTED
            else:
                q.status = QuoteStatus.REJECTED

        await self.session.flush()
        return RFQResponse.model_validate(rfq)
