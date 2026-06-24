from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.exceptions import NotFoundError
from app.domain.models import Company, Product, RFQ, Review
from app.infrastructure.database.repositories import CompanyRepository
from app.schemas.company import CompanyDetailsResponse, CompanyUpdate
from sqlalchemy import select, func


class CompanyService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.companies = CompanyRepository(session)

    async def get_company_details(self, company_id: UUID) -> CompanyDetailsResponse:
        company = await self.companies.get_by_id(company_id)
        if not company:
            raise NotFoundError("Company")
        return CompanyDetailsResponse.model_validate(company)

    async def update_company(self, company_id: UUID, payload: CompanyUpdate) -> CompanyDetailsResponse:
        company = await self.companies.get_by_id(company_id)
        if not company:
            raise NotFoundError("Company")

        company.name = payload.name
        if payload.description is not None:
            company.description = payload.description
        if payload.country is not None:
            company.country = payload.country
        if payload.city is not None:
            company.city = payload.city

        await self.session.flush()
        return CompanyDetailsResponse.model_validate(company)

    async def get_company_stats(self, company_id: UUID) -> dict:
        # Number of active products
        prod_stmt = select(func.count(Product.id)).where(Product.company_id == company_id, Product.is_active == True)
        prod_res = await self.session.execute(prod_stmt)
        products_count = prod_res.scalar() or 0

        # Number of active RFQs
        from app.domain.enums import RFQStatus
        rfq_stmt = select(func.count(RFQ.id)).where(RFQ.company_id == company_id, RFQ.status == RFQStatus.OPEN)
        rfq_res = await self.session.execute(rfq_stmt)
        rfqs_count = rfq_res.scalar() or 0

        # Average Review Rating
        rev_stmt = select(func.avg(Review.rating)).where(Review.company_id == company_id)
        rev_res = await self.session.execute(rev_stmt)
        avg_rating = rev_res.scalar()
        avg_rating = float(avg_rating) if avg_rating is not None else 0.0

        return {
            "products_count": products_count,
            "rfqs_count": rfqs_count,
            "average_rating": avg_rating
        }
