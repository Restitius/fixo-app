"""Booking domain router — Modules 16 & 17 endpoints."""
from __future__ import annotations

from typing import Literal

from fastapi import APIRouter, Query
from pydantic import BaseModel, Field

from app.api.deps.auth import CurrentCustomer
from app.api.responses.response import ok
from app.startup.composition import get_composition

router = APIRouter(prefix="/bookings", tags=["bookings"])


class BookingCreate(BaseModel):
    quote_id: str
    promo_code: str | None = Field(default=None, max_length=40)


@router.post("", status_code=201)
async def confirm(payload: BookingCreate, customer: CurrentCustomer) -> dict:
    svc = get_composition().booking_service()
    result = await svc.confirm_from_quote(
        str(customer["customer_id"]), payload.quote_id, payload.promo_code
    )
    return ok(result, title="Booking confirmed", status_code=201)


@router.get("")
async def list_bookings(
    customer: CurrentCustomer,
    status: str | None = None,
    limit: int = Query(default=20, ge=1, le=50),
    offset: int = Query(default=0, ge=0),
) -> dict:
    svc = get_composition().booking_service()
    return ok(await svc.list(str(customer["customer_id"]),
                             status=status, limit=limit, offset=offset))


@router.get("/{booking_id}")
async def get_booking(booking_id: str, customer: CurrentCustomer) -> dict:
    svc = get_composition().booking_service()
    return ok(await svc.get(str(customer["customer_id"]), booking_id))


class AuthorizePaymentRequest(BaseModel):
    payment_method: Literal["WALLET", "EXTERNAL"] = "EXTERNAL"


@router.post("/{booking_id}/authorize-payment")
async def authorize_payment(
    booking_id: str, customer: CurrentCustomer, payload: AuthorizePaymentRequest | None = None
) -> dict:
    svc = get_composition().booking_service()
    method = payload.payment_method if payload else "EXTERNAL"
    result = await svc.authorize_payment(str(customer["customer_id"]), booking_id, method)
    return ok(result, title=f"Payment {result['payment']['status']}")


class RescheduleRequest(BaseModel):
    scheduled_date: str = Field(description="New date, YYYY-MM-DD")
    time_window: str = Field(description="MORNING | AFTERNOON | EVENING")
    reason: str | None = Field(default=None, max_length=300)


@router.post("/{booking_id}/reschedule")
async def reschedule(booking_id: str, payload: RescheduleRequest, customer: CurrentCustomer) -> dict:
    svc = get_composition().booking_service()
    result = await svc.reschedule(
        str(customer["customer_id"]), booking_id, payload.scheduled_date,
        payload.time_window, payload.reason,
    )
    return ok(result, title="Booking rescheduled")


@router.post("/{booking_id}/cancel")
async def cancel(booking_id: str, customer: CurrentCustomer) -> dict:
    svc = get_composition().booking_service()
    return ok(await svc.cancel(str(customer["customer_id"]), booking_id),
              title="Booking cancelled")


@router.post("/{booking_id}/capture-final-payment")
async def capture_final_payment(booking_id: str, customer: CurrentCustomer) -> dict:
    svc = get_composition().final_payment_service()
    result = await svc.capture_final_payment(str(customer["customer_id"]), booking_id)
    return ok(result, title="Payment captured")


@router.post("/{booking_id}/confirm-completion")
async def confirm_completion(booking_id: str, customer: CurrentCustomer) -> dict:
    svc = get_composition().completion_service()
    result = await svc.confirm_completion(str(customer["customer_id"]), booking_id)
    return ok(result, title="Service completed")


@router.post("/{booking_id}/close")
async def close_booking(booking_id: str, customer: CurrentCustomer) -> dict:
    svc = get_composition().booking_close_service()
    result = await svc.close_booking(str(customer["customer_id"]), booking_id)
    return ok(result, title="Booking closed", status_code=201)


@router.get("/{booking_id}/timeline")
async def timeline(booking_id: str, customer: CurrentCustomer) -> dict:
    svc = get_composition().booking_service()
    return ok(await svc.timeline(str(customer["customer_id"]), booking_id))