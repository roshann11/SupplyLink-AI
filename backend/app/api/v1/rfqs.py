from typing import Annotated
from uuid import UUID
from fastapi import APIRouter, Depends, status
from app.dependencies import get_current_user, get_rfq_service
from app.schemas.auth import UserResponse
from app.schemas.rfq import RFQCreate, RFQResponse, QuoteCreate, QuoteResponse
from app.services.rfq_service import RFQService

router = APIRouter(prefix="/rfqs", tags=["rfqs"])


@router.get("", response_model=list[RFQResponse])
async def list_open_rfqs(
    rfq_service: Annotated[RFQService, Depends(get_rfq_service)],
    offset: int = 0,
    limit: int = 20,
) -> list[RFQResponse]:
    return await rfq_service.list_active_open_rfqs(offset=offset, limit=limit)


@router.get("/my", response_model=list[RFQResponse])
async def list_my_rfqs(
    current_user: Annotated[UserResponse, Depends(get_current_user)],
    rfq_service: Annotated[RFQService, Depends(get_rfq_service)],
    offset: int = 0,
    limit: int = 20,
) -> list[RFQResponse]:
    return await rfq_service.list_my_rfqs(current_user.company.id, offset=offset, limit=limit)


@router.get("/{rfq_id}", response_model=RFQResponse)
async def get_rfq(
    rfq_id: UUID,
    rfq_service: Annotated[RFQService, Depends(get_rfq_service)],
) -> RFQResponse:
    return await rfq_service.get_rfq_details(rfq_id)


@router.post("", response_model=RFQResponse, status_code=status.HTTP_201_CREATED)
async def create_rfq(
    payload: RFQCreate,
    current_user: Annotated[UserResponse, Depends(get_current_user)],
    rfq_service: Annotated[RFQService, Depends(get_rfq_service)],
) -> RFQResponse:
    return await rfq_service.create_rfq(current_user.company.id, current_user.id, payload)


@router.post("/{rfq_id}/quotes", response_model=QuoteResponse, status_code=status.HTTP_201_CREATED)
async def submit_quote(
    rfq_id: UUID,
    payload: QuoteCreate,
    current_user: Annotated[UserResponse, Depends(get_current_user)],
    rfq_service: Annotated[RFQService, Depends(get_rfq_service)],
) -> QuoteResponse:
    return await rfq_service.submit_quote(rfq_id, current_user.company.id, current_user.id, payload)


@router.get("/{rfq_id}/quotes", response_model=list[QuoteResponse])
async def list_quotes(
    rfq_id: UUID,
    current_user: Annotated[UserResponse, Depends(get_current_user)],
    rfq_service: Annotated[RFQService, Depends(get_rfq_service)],
) -> list[QuoteResponse]:
    return await rfq_service.list_rfq_quotes(rfq_id, current_user.company.id)


@router.post("/{rfq_id}/quotes/{quote_id}/award", response_model=RFQResponse)
async def award_quote(
    rfq_id: UUID,
    quote_id: UUID,
    current_user: Annotated[UserResponse, Depends(get_current_user)],
    rfq_service: Annotated[RFQService, Depends(get_rfq_service)],
) -> RFQResponse:
    return await rfq_service.award_quote(rfq_id, quote_id, current_user.company.id)
