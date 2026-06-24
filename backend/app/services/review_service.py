from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.exceptions import NotFoundError, ConflictError
from app.domain.models import Review, Company
from app.infrastructure.database.repositories import ReviewRepository, CompanyRepository
from app.schemas.review import ReviewCreate, ReviewResponse, CompanyRatingSummary
from sqlalchemy import select, func


class ReviewService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.reviews = ReviewRepository(session)
        self.companies = CompanyRepository(session)

    async def create_review(
        self, reviewer_company_id: UUID, company_id: UUID, payload: ReviewCreate
    ) -> ReviewResponse:
        if reviewer_company_id == company_id:
            raise ConflictError("You cannot review your own company")

        target = await self.companies.get_by_id(company_id)
        if not target:
            raise NotFoundError("Target Company")

        # Optional: check if reviewer already reviewed this company
        existing_stmt = select(Review).where(
            Review.company_id == company_id,
            Review.reviewer_company_id == reviewer_company_id
        )
        existing_res = await self.session.execute(existing_stmt)
        if existing_res.scalar_one_or_none():
            raise ConflictError("You have already reviewed this company")

        review = Review(
            company_id=company_id,
            reviewer_company_id=reviewer_company_id,
            rating=payload.rating,
            comment=payload.comment,
        )
        await self.reviews.add(review)
        return ReviewResponse.model_validate(review)

    async def list_company_reviews(self, company_id: UUID) -> list[ReviewResponse]:
        reviews = await self.reviews.list_for_company(company_id)
        return [ReviewResponse.model_validate(r) for r in reviews]

    async def get_rating_summary(self, company_id: UUID) -> CompanyRatingSummary:
        avg_rating = await self.reviews.get_average_rating(company_id)
        
        count_stmt = select(func.count(Review.id)).where(Review.company_id == company_id)
        count_res = await self.session.execute(count_stmt)
        count_val = count_res.scalar() or 0

        return CompanyRatingSummary(
            average_rating=avg_rating,
            review_count=count_val
        )
