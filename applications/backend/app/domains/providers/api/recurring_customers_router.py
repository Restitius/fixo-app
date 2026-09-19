"""Provider recurring customers router - Phase 42.

Prefix: /providers/me/recurring-customers

A "recurring customer" here means a repeat customer of THIS provider —
2+ completed (CLOSED) bookings — not the customer-initiated
RECURRING_SERVICES subscription system, which is a separate feature.
"""
from __future__ import annotations

from fastapi import APIRouter, Query
from pydantic import BaseModel, Field

from app.api.deps.provider_auth import CurrentProvider
from app.api.responses.response import ok
from app.startup.composition import get_composition

router = APIRouter(prefix="/providers/me/recurring-customers", tags=["provider-recurring-customers"])


class SetNoteRequest(BaseModel):
    note: str = Field(min_length=1, max_length=2000)


@router.get("/")
async def list_customers(
    provider: CurrentProvider,
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
) -> dict:
    svc = get_composition().provider_recurring_customers_service()
    return ok(await svc.list_customers(str(provider["provider_id"]), limit=limit, offset=offset))


@router.get("/{customer_id}")
async def get_customer(customer_id: str, provider: CurrentProvider) -> dict:
    svc = get_composition().provider_recurring_customers_service()
    return ok(await svc.get_customer(str(provider["provider_id"]), customer_id=customer_id))


@router.get("/{customer_id}/bookings")
async def list_bookings(
    customer_id: str,
    provider: CurrentProvider,
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
) -> dict:
    svc = get_composition().provider_recurring_customers_service()
    return ok(
        await svc.list_bookings(
            str(provider["provider_id"]), customer_id=customer_id, limit=limit, offset=offset
        )
    )


@router.put("/{customer_id}/note")
async def set_note(customer_id: str, payload: SetNoteRequest, provider: CurrentProvider) -> dict:
    svc = get_composition().provider_recurring_customers_service()
    result = await svc.set_note(
        str(provider["provider_id"]), customer_id=customer_id, note=payload.note
    )
    return ok(result, title="Note saved")
