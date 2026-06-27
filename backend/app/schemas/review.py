from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, Field
from app.schemas.common import ORMModel


class ReviewCreate(BaseModel):
    rating: int = Field(..., ge=1, le=5)
    comment: str | None = None


class ReviewResponse(ORMModel):
    id: UUID
    company_id: UUID
    reviewer_company_id: UUID
    rating: int
    comment: str | None
    created_at: datetime
    updated_at: datetime


class CompanyRatingSummary(BaseModel):
    average_rating: float
    review_count: int
