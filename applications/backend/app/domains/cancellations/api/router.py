"""Cancellations domain router - Module 37 (customer side)."""
from __future__ import annotations

from fastapi import APIRouter, Query
from pydantic import BaseModel, Field

from app.api.deps.auth import CurrentCustomer
from app.api.responses.response import ok
from app.startup.composition import get_composition

router = APIRouter(prefix="/cancellations", tags=["cancellations"])


class CancelBookingRequest(BaseModel):
    booking_id: str
    reason: str = Field(min_length=3, max_length=500)


@router.post("/preview")
async def preview_cancellation(
    customer: CurrentCustomer,
    booking_id: str = Query(..., description="Booking to price a cancellation for"),
) -> dict:
    svc = get_composition().cancellation_service()
    return ok(await svc.preview(booking_id, str(customer["customer_id"])))


@router.post("/cancel")
async def cancel_booking(
    payload: CancelBookingRequest,
    customer: CurrentCustomer,
) -> dict:
    svc = get_composition().cancellation_service()
    result = await svc.cancel(
        payload.booking_id, str(customer["customer_id"]), reason=payload.reason
    )
    return ok(result, title="Booking cancelled")


@router.get("/history")
async def cancellation_history(
    customer: CurrentCustomer,
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
) -> dict:
    svc = get_composition().cancellation_service()
    return ok(await svc.history(str(customer["customer_id"]), limit=limit, offset=offset))
