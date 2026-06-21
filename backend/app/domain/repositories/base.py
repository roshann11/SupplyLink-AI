from abc import ABC, abstractmethod
from typing import Generic, TypeVar
from uuid import UUID

from sqlalchemy import Select, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.models import Base

ModelT = TypeVar("ModelT", bound=Base)


class BaseRepository(ABC, Generic[ModelT]):
    def __init__(self, session: AsyncSession, model: type[ModelT]) -> None:
        self.session = session
        self.model = model

    async def get_by_id(self, entity_id: UUID) -> ModelT | None:
        return await self.session.get(self.model, entity_id)

    async def list_all(self, *, offset: int = 0, limit: int = 20) -> list[ModelT]:
        stmt: Select[tuple[ModelT]] = select(self.model).offset(offset).limit(limit)
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def count(self) -> int:
        stmt = select(func.count()).select_from(self.model)
        result = await self.session.execute(stmt)
        return int(result.scalar_one())

    async def add(self, entity: ModelT) -> ModelT:
        self.session.add(entity)
        await self.session.flush()
        await self.session.refresh(entity)
        return entity

    async def delete(self, entity: ModelT) -> None:
        await self.session.delete(entity)
        await self.session.flush()

    @abstractmethod
    async def get_by_id_for_company(self, entity_id: UUID, company_id: UUID) -> ModelT | None:
        """Tenant-scoped lookup. Override in concrete repositories."""
