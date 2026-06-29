from typing import Annotated
from fastapi import APIRouter, Depends
from app.dependencies import get_current_user, get_company_service
from app.schemas.auth import UserResponse
from app.schemas.company import CompanyDetailsResponse, CompanyUpdate
from app.services.company_service import CompanyService

router = APIRouter(prefix="/companies", tags=["companies"])


@router.get("/me", response_model=CompanyDetailsResponse)
async def get_my_company(
    current_user: Annotated[UserResponse, Depends(get_current_user)],
    company_service: Annotated[CompanyService, Depends(get_company_service)],
) -> CompanyDetailsResponse:
    return await company_service.get_company_details(current_user.company.id)


@router.put("/me", response_model=CompanyDetailsResponse)
async def update_my_company(
    payload: CompanyUpdate,
    current_user: Annotated[UserResponse, Depends(get_current_user)],
    company_service: Annotated[CompanyService, Depends(get_company_service)],
) -> CompanyDetailsResponse:
    return await company_service.update_company(current_user.company.id, payload)


@router.get("/me/stats")
async def get_my_company_stats(
    current_user: Annotated[UserResponse, Depends(get_current_user)],
    company_service: Annotated[CompanyService, Depends(get_company_service)],
) -> dict:
    return await company_service.get_company_stats(current_user.company.id)
