"""Home domain router — dashboard aggregator."""
from __future__ import annotations

from fastapi import APIRouter

from app.api.deps.auth import CurrentCustomer
from app.api.responses.response import ok
from app.startup.composition import get_composition

router = APIRouter(prefix="/home", tags=["home"])


@router.get("/dashboard")
async def dashboard(customer: CurrentCustomer) -> dict:
    svc = get_composition().home_service()
    data = await svc.dashboard(str(customer["customer_id"]), str(customer.get("full_name", "")))
    return ok(data)