from uuid import UUID
from pydantic import BaseModel, Field
from app.domain.enums import CompanyType
from app.schemas.common import ORMModel


class CompanyUpdate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    description: str | None = None
    country: str | None = Field(None, max_length=100)
    city: str | None = Field(None, max_length=100)


class CompanyDetailsResponse(ORMModel):
    id: UUID
    name: str
    slug: str
    company_type: CompanyType
    description: str | None
    country: str | None
    city: str | None
    is_verified: bool
