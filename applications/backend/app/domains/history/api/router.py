"""History router — Modules 40 + 42 (booking history, timeline, activity feed)."""
from __future__ import annotations

from fastapi import APIRouter, Query

from app.api.deps.auth import CurrentCustomer
from app.api.responses.response import ok
from app.startup.composition import get_composition

router = APIRouter(prefix="/history", tags=["history"])


@router.get("/bookings")
async def bookings(
    customer: CurrentCustomer,
    status: str | None = Query(None, max_length=20),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
) -> dict:
    svc = get_composition().history_service()
    return ok(await svc.bookings(str(customer["customer_id"]), status, limit, offset))


@router.get("/bookings/{booking_id}/timeline")
async def timeline(booking_id: str, customer: CurrentCustomer) -> dict:
    svc = get_composition().history_service()
    return ok(await svc.timeline(str(customer["customer_id"]), booking_id))


@router.get("/activity")
async def activity(
    customer: CurrentCustomer,
    event: str | None = Query(None, max_length=40),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
) -> dict:
    svc = get_composition().history_service()
    return ok(await svc.activity(str(customer["customer_id"]), event, limit, offset))