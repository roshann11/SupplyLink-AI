from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, Field
from app.schemas.common import ORMModel


class MessageSend(BaseModel):
    receiver_id: UUID
    content: str = Field(..., min_length=1)


class MessageResponse(ORMModel):
    id: UUID
    sender_id: UUID
    receiver_id: UUID
    content: str
    read_at: datetime | None
    created_at: datetime


class ConversationContactResponse(BaseModel):
    id: UUID
    email: str
    first_name: str
    last_name: str
    company_name: str
