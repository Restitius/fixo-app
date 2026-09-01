"""Tracking domain router — Modules 21 & 22 customer-side endpoints."""
from __future__ import annotations

from fastapi import APIRouter, Query
from pydantic import BaseModel

from app.api.deps.auth import CurrentCustomer
from app.api.responses.response import ok
from app.startup.composition import get_composition

router = APIRouter(prefix="/bookings/{booking_id}", tags=["tracking"])


class ArrivalVerify(BaseModel):
    code: str


@router.get("/tracking")
async def latest_position(booking_id: str, customer: CurrentCustomer) -> dict:
    svc = get_composition().tracking_service()
    return ok(await svc.latest_position(str(customer["customer_id"]), booking_id))


@router.post("/verify-arrival")
async def verify_arrival(
    booking_id: str, payload: ArrivalVerify, customer: CurrentCustomer
) -> dict:
    svc = get_composition().tracking_service()
    result = await svc.verify_arrival(
        str(customer["customer_id"]), booking_id, payload.code
    )
    return ok(result, title="Arrival verified")