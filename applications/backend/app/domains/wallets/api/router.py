"""Wallet router — Module 34."""
from __future__ import annotations

from fastapi import APIRouter, Query

from app.api.deps.auth import CurrentCustomer
from app.api.responses.response import ok
from app.startup.composition import get_composition

router = APIRouter(prefix="/wallet", tags=["wallet"])


@router.get("/balance")
async def balance(customer: CurrentCustomer) -> dict:
    svc = get_composition().wallet_service()
    return ok(await svc.balance(str(customer["customer_id"])))


@router.get("/transactions")
async def transactions(
    customer: CurrentCustomer,
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
) -> dict:
    svc = get_composition().wallet_service()
    rows = await svc.transactions(str(customer["customer_id"]), limit, offset)
    return ok(rows)
