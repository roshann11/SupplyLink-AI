from typing import Annotated
from uuid import UUID
from fastapi import APIRouter, Depends, status
from app.dependencies import get_current_user, get_review_service
from app.schemas.auth import UserResponse
from app.schemas.review import ReviewCreate, ReviewResponse, CompanyRatingSummary
from app.services.review_service import ReviewService

router = APIRouter(prefix="/reviews", tags=["reviews"])


@router.post("/company/{company_id}", response_model=ReviewResponse, status_code=status.HTTP_201_CREATED)
async def create_review(
    company_id: UUID,
    payload: ReviewCreate,
    current_user: Annotated[UserResponse, Depends(get_current_user)],
    review_service: Annotated[ReviewService, Depends(get_review_service)],
) -> ReviewResponse:
    return await review_service.create_review(current_user.company.id, company_id, payload)


@router.get("/company/{company_id}", response_model=list[ReviewResponse])
async def list_reviews(
    company_id: UUID,
    review_service: Annotated[ReviewService, Depends(get_review_service)],
) -> list[ReviewResponse]:
    return await review_service.list_company_reviews(company_id)


@router.get("/company/{company_id}/summary", response_model=CompanyRatingSummary)
async def get_rating_summary(
    company_id: UUID,
    review_service: Annotated[ReviewService, Depends(get_review_service)],
) -> CompanyRatingSummary:
    return await review_service.get_rating_summary(company_id)
