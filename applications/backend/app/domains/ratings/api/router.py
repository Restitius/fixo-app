"""Ratings domain router — Module 51 (ratings/reviews)."""
from __future__ import annotations

from fastapi import APIRouter
from pydantic import BaseModel, Field

from app.api.deps.auth import CurrentCustomer
from app.api.responses.response import ok
from app.startup.composition import get_composition


class RatingSubmitRequest(BaseModel):
    rating: int = Field(..., ge=1, le=5, description="Star rating 1-5")
    comment: str | None = Field(default=None, max_length=500, description="Optional review comment")


router = APIRouter(prefix="/ratings", tags=["ratings"])


@router.get("")
async def list_mine(customer: CurrentCustomer) -> dict:
    svc = get_composition().rating_service()
    return ok(await svc.list_mine(str(customer["customer_id"])))


@router.post("/{booking_id}", status_code=201)
async def submit_rating(booking_id: str, payload: RatingSubmitRequest, customer: CurrentCustomer) -> dict:
    svc = get_composition().rating_service()
    result = await svc.submit(booking_id, str(customer["customer_id"]), payload.rating, payload.comment)
    return ok(result, title="Rating submitted", status_code=201)


@router.get("/{booking_id}")
async def get_rating(booking_id: str, customer: CurrentCustomer) -> dict:
    svc = get_composition().rating_service()
    return ok(await svc.get_for_booking(booking_id, str(customer["customer_id"])))


@router.get("/providers/{provider_id}/stars")
async def provider_stars(provider_id: str) -> dict:
    svc = get_composition().rating_service()
    return ok(await svc.provider_stars(provider_id))