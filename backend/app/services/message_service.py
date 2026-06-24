from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.exceptions import NotFoundError
from app.domain.models import Message, User
from app.infrastructure.database.repositories import MessageRepository, UserRepository
from app.schemas.message import MessageSend, MessageResponse, ConversationContactResponse
from sqlalchemy import select
from sqlalchemy.orm import selectinload


class MessageService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.messages = MessageRepository(session)
        self.users = UserRepository(session)

    async def send_message(self, sender_id: UUID, payload: MessageSend) -> MessageResponse:
        receiver = await self.users.get_by_id(payload.receiver_id)
        if not receiver:
            raise NotFoundError("Recipient user")

        msg = Message(
            sender_id=sender_id,
            receiver_id=payload.receiver_id,
            content=payload.content,
        )
        await self.messages.add(msg)
        return MessageResponse.model_validate(msg)

    async def get_chat_history(self, user_a: UUID, user_b: UUID) -> list[MessageResponse]:
        # Fetch and mark as read
        history = await self.messages.get_chat_history(user_a, user_b)
        await self.messages.mark_as_read(user_b, user_a) # mark messages from user_b to user_a as read
        return [MessageResponse.model_validate(m) for m in history]

    async def list_conversations(self, user_id: UUID) -> list[ConversationContactResponse]:
        contact_ids = await self.messages.get_active_conversations(user_id)
        if not contact_ids:
            return []

        stmt = (
            select(User)
            .options(selectinload(User.company))
            .where(User.id.in_(contact_ids))
        )
        res = await self.session.execute(stmt)
        users = res.scalars().all()

        return [
            ConversationContactResponse(
                id=u.id,
                email=u.email,
                first_name=u.first_name,
                last_name=u.last_name,
                company_name=u.company.name if u.company else "Independent"
            )
            for u in users
        ]
