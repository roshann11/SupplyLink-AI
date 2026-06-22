from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field

from app.domain.enums import CompanyType, UserRole
from app.schemas.common import ORMModel


class CompanySummary(ORMModel):
    id: UUID
    name: str
    slug: str
    company_type: CompanyType
    is_verified: bool


class UserResponse(ORMModel):
    id: UUID
    email: EmailStr
    first_name: str
    last_name: str
    role: UserRole
    is_active: bool
    company: CompanySummary
    last_login_at: datetime | None = None


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    first_name: str = Field(min_length=1, max_length=100)
    last_name: str = Field(min_length=1, max_length=100)
    company_name: str = Field(min_length=1, max_length=255)
    company_type: CompanyType
    role: UserRole


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class RefreshRequest(BaseModel):
    refresh_token: str
