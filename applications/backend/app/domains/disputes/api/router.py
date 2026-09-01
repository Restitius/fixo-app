"""Disputes domain router - Module 39 (customer protection)."""
from __future__ import annotations

from fastapi import APIRouter, Query
from pydantic import BaseModel, Field

from app.api.deps.auth import CurrentCustomer
from app.api.responses.response import ok
from app.startup.composition import get_composition

router = APIRouter(prefix="/disputes", tags=["disputes"])


class OpenDisputeRequest(BaseModel):
    booking_id: str
    category: str
    description: str = Field(min_length=10, max_length=2000)


class AddEvidenceRequest(BaseModel):
    kind: str
    url: str = Field(min_length=1, max_length=2000)
    note: str | None = None


@router.post("", status_code=201)
async def open_dispute(payload: OpenDisputeRequest, customer: CurrentCustomer) -> dict:
    svc = get_composition().dispute_service()
    result = await svc.open_dispute(
        payload.booking_id, str(customer["customer_id"]), payload.category, payload.description
    )
    return ok(result, title="Dispute opened", status_code=201)


@router.get("")
async def list_disputes(
    customer: CurrentCustomer,
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
) -> dict:
    svc = get_composition().dispute_service()
    return ok(await svc.list_disputes(str(customer["customer_id"]), limit=limit, offset=offset))


@router.get("/{dispute_id}")
async def get_dispute(dispute_id: str, customer: CurrentCustomer) -> dict:
    svc = get_composition().dispute_service()
    return ok(await svc.get_dispute(dispute_id, str(customer["customer_id"])))


@router.post("/{dispute_id}/evidence", status_code=201)
async def add_evidence(
    dispute_id: str, payload: AddEvidenceRequest, customer: CurrentCustomer,
) -> dict:
    svc = get_composition().dispute_service()
    result = await svc.add_evidence(
        dispute_id, str(customer["customer_id"]), payload.kind, payload.url, payload.note
    )
    return ok(result, title="Evidence attached", status_code=201)


@router.get("/{dispute_id}/evidence")
async def list_evidence(dispute_id: str, customer: CurrentCustomer) -> dict:
    svc = get_composition().dispute_service()
    return ok(await svc.list_evidence(dispute_id, str(customer["customer_id"])))


@router.post("/{dispute_id}/withdraw")
async def withdraw_dispute(dispute_id: str, customer: CurrentCustomer) -> dict:
    svc = get_composition().dispute_service()
    result = await svc.withdraw(dispute_id, str(customer["customer_id"]))
    return ok(result, title="Dispute withdrawn")
