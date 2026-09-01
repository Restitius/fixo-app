"""Reviews domain router — Phase 10 module 28."""
from __future__ import annotations
from fastapi import APIRouter, Query
from pydantic import BaseModel, Field
from app.api.deps.auth import CurrentCustomer
from app.api.responses.response import ok
from app.startup.composition import get_composition

router = APIRouter(prefix="/reviews", tags=["reviews"])


class ReviewCreate(BaseModel):
    booking_id: str
    service_id: str
    provider_id: str
    rating: int = Field(ge=1, le=5)
    comment: str | None = Field(default=None, max_length=1000)


@router.post("", status_code=201)
async def create_review(payload: ReviewCreate, customer: CurrentCustomer) -> dict:
    svc = get_composition().review_service()
    return ok(await svc.create(str(customer["customer_id"]), payload.model_dump()),
              title="Review submitted", status_code=201)


@router.get("")
async def list_reviews(
    customer: CurrentCustomer,
    entity_type: str = Query(default="service"),
    entity_id: str = Query(...),
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=10, ge=1, le=20),
) -> dict:
    svc = get_composition().review_service()
    return ok(await svc.list(str(customer["customer_id"]), entity_type, entity_id, page, limit))


@router.get("/stats/{entity_type}/{entity_id}")
async def review_stats(entity_type: str, entity_id: str, customer: CurrentCustomer) -> dict:
    svc = get_composition().review_service()
    return ok(await svc.stats(entity_type, entity_id))
