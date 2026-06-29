from fastapi import APIRouter

from app.api.v1 import auth, companies, products, rfqs, messages, reviews

api_router = APIRouter()
api_router.include_router(auth.router)
api_router.include_router(companies.router)
api_router.include_router(products.router)
api_router.include_router(rfqs.router)
api_router.include_router(messages.router)
api_router.include_router(reviews.router)
