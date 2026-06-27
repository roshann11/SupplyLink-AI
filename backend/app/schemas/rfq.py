from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, Field
from app.domain.enums import QuoteStatus, RFQStatus
from app.schemas.common import ORMModel


class QuoteCreate(BaseModel):
    price: float = Field(..., gt=0)
    lead_time_days: int = Field(..., gt=0)
    notes: str | None = None


class QuoteResponse(ORMModel):
    id: UUID
    rfq_id: UUID
    company_id: UUID
    created_by_id: UUID
    price: float
    lead_time_days: int
    notes: str | None
    status: QuoteStatus
    created_at: datetime
    updated_at: datetime


class RFQCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    description: str = Field(..., min_length=1)
    quantity: int = Field(..., gt=0)
    target_price: float | None = Field(None, gt=0)
    expires_at: datetime | None = None


class RFQUpdate(BaseModel):
    title: str | None = Field(None, min_length=1, max_length=255)
    description: str | None = None
    quantity: int | None = Field(None, gt=0)
    target_price: float | None = Field(None, gt=0)
    status: RFQStatus | None = None
    expires_at: datetime | None = None


class RFQResponse(ORMModel):
    id: UUID
    company_id: UUID
    created_by_id: UUID
    title: str
    description: str
    quantity: int
    target_price: float | None
    status: RFQStatus
    expires_at: datetime | None
    created_at: datetime
    updated_at: datetime
    quotes: list[QuoteResponse] = []
