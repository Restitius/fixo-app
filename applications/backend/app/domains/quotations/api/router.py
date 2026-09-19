"""Quotation domain router — Module 15 endpoints."""
from __future__ import annotations

from fastapi import APIRouter

from app.api.deps.auth import CurrentCustomer
from app.api.responses.response import ok
from app.startup.composition import get_composition

router = APIRouter(tags=["quotations"])


@router.get("/service-requests/{request_id}/quotes")
async def list_quotes(request_id: str, customer: CurrentCustomer) -> dict:
    svc = get_composition().quotation_service()
    return ok(await svc.list_for_request(str(customer["customer_id"]), request_id))


@router.post("/quotes/{quote_id}/accept")
async def accept_quote(quote_id: str, customer: CurrentCustomer) -> dict:
    svc = get_composition().quotation_service()
    result = await svc.accept(str(customer["customer_id"]), quote_id)
    return ok(result, title="Quote accepted")