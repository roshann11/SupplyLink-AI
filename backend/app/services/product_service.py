from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.exceptions import NotFoundError, ForbiddenError
from app.domain.models import Product
from app.infrastructure.database.repositories import ProductRepository
from app.schemas.product import ProductCreate, ProductResponse, ProductUpdate


class ProductService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.products = ProductRepository(session)

    async def create_product(self, company_id: UUID, payload: ProductCreate) -> ProductResponse:
        product = Product(
            company_id=company_id,
            name=payload.name,
            sku=payload.sku,
            description=payload.description,
            price=payload.price,
            currency=payload.currency,
            stock_quantity=payload.stock_quantity,
            image_url=payload.image_url,
            is_active=True,
        )
        await self.products.add(product)
        return ProductResponse.model_validate(product)

    async def list_company_products(self, company_id: UUID, *, offset: int = 0, limit: int = 20) -> list[ProductResponse]:
        products = await self.products.list_by_company(company_id, offset=offset, limit=limit)
        return [ProductResponse.model_validate(p) for p in products]

    async def list_all_active_products(self, *, offset: int = 0, limit: int = 20) -> list[ProductResponse]:
        products = await self.products.list_active(offset=offset, limit=limit)
        return [ProductResponse.model_validate(p) for p in products]

    async def get_product(self, product_id: UUID) -> ProductResponse:
        product = await self.products.get_by_id(product_id)
        if not product:
            raise NotFoundError("Product")
        return ProductResponse.model_validate(product)

    async def update_product(self, product_id: UUID, company_id: UUID, payload: ProductUpdate) -> ProductResponse:
        product = await self.products.get_by_id(product_id)
        if not product:
            raise NotFoundError("Product")
        if product.company_id != company_id:
            raise ForbiddenError("You cannot modify another company's product")

        if payload.name is not None:
            product.name = payload.name
        if payload.sku is not None:
            product.sku = payload.sku
        if payload.description is not None:
            product.description = payload.description
        if payload.price is not None:
            product.price = payload.price
        if payload.currency is not None:
            product.currency = payload.currency
        if payload.stock_quantity is not None:
            product.stock_quantity = payload.stock_quantity
        if payload.image_url is not None:
            product.image_url = payload.image_url
        if payload.is_active is not None:
            product.is_active = payload.is_active

        await self.session.flush()
        return ProductResponse.model_validate(product)

    async def delete_product(self, product_id: UUID, company_id: UUID) -> None:
        product = await self.products.get_by_id(product_id)
        if not product:
            raise NotFoundError("Product")
        if product.company_id != company_id:
            raise ForbiddenError("You cannot delete another company's product")

        await self.products.delete(product)
