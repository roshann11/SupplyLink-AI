from typing import Annotated
from uuid import UUID
from fastapi import APIRouter, Depends, status
from app.dependencies import get_current_user, get_message_service
from app.schemas.auth import UserResponse
from app.schemas.message import MessageSend, MessageResponse, ConversationContactResponse
from app.services.message_service import MessageService

router = APIRouter(prefix="/messages", tags=["messages"])


@router.post("", response_model=MessageResponse, status_code=status.HTTP_201_CREATED)
async def send_message(
    payload: MessageSend,
    current_user: Annotated[UserResponse, Depends(get_current_user)],
    message_service: Annotated[MessageService, Depends(get_message_service)],
) -> MessageResponse:
    return await message_service.send_message(current_user.id, payload)


@router.get("/history/{other_user_id}", response_model=list[MessageResponse])
async def get_history(
    other_user_id: UUID,
    current_user: Annotated[UserResponse, Depends(get_current_user)],
    message_service: Annotated[MessageService, Depends(get_message_service)],
) -> list[MessageResponse]:
    return await message_service.get_chat_history(current_user.id, other_user_id)


@router.get("/conversations", response_model=list[ConversationContactResponse])
async def list_conversations(
    current_user: Annotated[UserResponse, Depends(get_current_user)],
    message_service: Annotated[MessageService, Depends(get_message_service)],
) -> list[ConversationContactResponse]:
    return await message_service.list_conversations(current_user.id)
