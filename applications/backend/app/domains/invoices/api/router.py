"""Invoice domain router — Module 27 endpoints."""
from __future__ import annotations

from fastapi import APIRouter, Query

from app.api.deps.auth import CurrentCustomer
from app.api.responses.response import ok
from app.startup.composition import get_composition

router = APIRouter(prefix="/invoices", tags=["invoices"])


@router.post("/bookings/{booking_id}/finalize", status_code=201)
async def finalize(booking_id: str, customer: CurrentCustomer) -> dict:
    svc = get_composition().invoice_service()
    result = await svc.finalize(str(customer["customer_id"]), booking_id)
    return ok(result, title="Invoice drafted", status_code=201)


@router.post("/{invoice_id}/issue")
async def issue(invoice_id: str, customer: CurrentCustomer) -> dict:
    svc = get_composition().invoice_service()
    return ok(await svc.issue(str(customer["customer_id"]), invoice_id),
              title="Invoice issued")


@router.get("")
async def list_invoices(
    customer: CurrentCustomer,
    limit: int = Query(default=20, ge=1, le=50),
    offset: int = Query(default=0, ge=0),
) -> dict:
    svc = get_composition().invoice_service()
    return ok(await svc.list(str(customer["customer_id"]), limit=limit, offset=offset))


@router.get("/{invoice_id}")
async def get_invoice(invoice_id: str, customer: CurrentCustomer) -> dict:
    svc = get_composition().invoice_service()
    return ok(await svc.get(str(customer["customer_id"]), invoice_id))