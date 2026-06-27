from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, Field
from app.schemas.common import ORMModel


class ProductCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    sku: str = Field(min_length=1, max_length=100)
    description: str | None = None
    price: float | None = Field(None, ge=0)
    currency: str = Field("USD", min_length=3, max_length=3)
    stock_quantity: int = Field(0, ge=0)
    image_url: str | None = Field(None, max_length=500)


class ProductUpdate(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=255)
    sku: str | None = Field(None, min_length=1, max_length=100)
    description: str | None = None
    price: float | None = Field(None, ge=0)
    currency: str | None = Field(None, min_length=3, max_length=3)
    stock_quantity: int | None = Field(None, ge=0)
    image_url: str | None = Field(None, max_length=500)
    is_active: bool | None = None


class ProductResponse(ORMModel):
    id: UUID
    company_id: UUID
    name: str
    sku: str
    description: str | None
    price: float | None
    currency: str
    stock_quantity: int
    image_url: str | None
    is_active: bool
    created_at: datetime
    updated_at: datetime
