from typing import Annotated
from uuid import UUID
from fastapi import APIRouter, Depends, status, Response
from app.dependencies import get_current_user, get_product_service, require_roles
from app.domain.enums import UserRole
from app.schemas.auth import UserResponse
from app.schemas.product import ProductCreate, ProductResponse, ProductUpdate
from app.services.product_service import ProductService

router = APIRouter(prefix="/products", tags=["products"])


@router.get("", response_model=list[ProductResponse])
async def list_active_products(
    product_service: Annotated[ProductService, Depends(get_product_service)],
    offset: int = 0,
    limit: int = 20,
) -> list[ProductResponse]:
    return await product_service.list_all_active_products(offset=offset, limit=limit)


@router.get("/my", response_model=list[ProductResponse])
async def list_my_products(
    current_user: Annotated[UserResponse, Depends(get_current_user)],
    product_service: Annotated[ProductService, Depends(get_product_service)],
    offset: int = 0,
    limit: int = 20,
) -> list[ProductResponse]:
    return await product_service.list_company_products(current_user.company.id, offset=offset, limit=limit)


@router.get("/{product_id}", response_model=ProductResponse)
async def get_product(
    product_id: UUID,
    product_service: Annotated[ProductService, Depends(get_product_service)],
) -> ProductResponse:
    return await product_service.get_product(product_id)


@router.post("", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
async def create_product(
    payload: ProductCreate,
    current_user: Annotated[UserResponse, Depends(get_current_user)],
    product_service: Annotated[ProductService, Depends(get_product_service)],
) -> ProductResponse:
    # Only manufacturers/suppliers should build catalog items
    return await product_service.create_product(current_user.company.id, payload)


@router.put("/{product_id}", response_model=ProductResponse)
async def update_product(
    product_id: UUID,
    payload: ProductUpdate,
    current_user: Annotated[UserResponse, Depends(get_current_user)],
    product_service: Annotated[ProductService, Depends(get_product_service)],
) -> ProductResponse:
    return await product_service.update_product(product_id, current_user.company.id, payload)


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_product(
    product_id: UUID,
    current_user: Annotated[UserResponse, Depends(get_current_user)],
    product_service: Annotated[ProductService, Depends(get_product_service)],
) -> None:
    await product_service.delete_product(product_id, current_user.company.id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
