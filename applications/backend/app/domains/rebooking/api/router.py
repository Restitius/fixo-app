"""Rebooking domain router — Phase 10 module 30 (rebooking)."""
from __future__ import annotations

from fastapi import APIRouter

from app.api.deps.auth import CurrentCustomer
from app.api.responses.response import ok
from app.startup.composition import get_composition

router = APIRouter(prefix="/bookings", tags=["rebook"])


@router.get("/{booking_id}/rebook-preview")
async def preview_rebook(booking_id: str, customer: CurrentCustomer) -> dict:
    svc = get_composition().rebook_service()
    return ok(await svc.preview(str(customer["customer_id"]), booking_id))


@router.post("/{booking_id}/rebook", status_code=201)
async def create_rebook(booking_id: str, customer: CurrentCustomer) -> dict:
    svc = get_composition().rebook_service()
    return ok(await svc.rebook(str(customer["customer_id"]), booking_id),
              title="Rebook request created", status_code=201)
