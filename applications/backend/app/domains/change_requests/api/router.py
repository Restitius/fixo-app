"""Change-request domain router — Module 24 endpoints (customer side)."""
from __future__ import annotations

from fastapi import APIRouter
from pydantic import BaseModel, Field

from app.api.deps.auth import CurrentCustomer
from app.api.responses.response import ok
from app.startup.composition import get_composition

router = APIRouter(prefix="/bookings/{booking_id}", tags=["change-requests"])


class ChangePropose(BaseModel):
    change_type: str            # SCOPE | TIME | PRICE
    proposed_value: str = Field(min_length=1, max_length=500)
    reason: str | None = None


class ChangeDecide(BaseModel):
    decision: str               # APPROVED | DECLINED


@router.get("/change-requests")
async def list_changes(booking_id: str, customer: CurrentCustomer) -> dict:
    svc = get_composition().change_request_service()
    return ok(await svc.list_for_booking(str(customer["customer_id"]), booking_id))


@router.post("/change-requests", status_code=201)
async def propose_change(
    booking_id: str, payload: ChangePropose, customer: CurrentCustomer
) -> dict:
    svc = get_composition().change_request_service()
    result = await svc.propose(
        str(customer["customer_id"]), booking_id, payload.model_dump()
    )
    return ok(result, title="Change requested", status_code=201)


@router.post("/change-requests/{change_id}/decide")
async def decide_change(
    booking_id: str, change_id: str,
    payload: ChangeDecide, customer: CurrentCustomer,
) -> dict:
    svc = get_composition().change_request_service()
    result = await svc.decide(
        str(customer["customer_id"]), change_id, decision=payload.decision
    )
    return ok(result, title=f"Change {result['status']}")
