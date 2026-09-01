"""Promotions router — Module 35."""
from __future__ import annotations

from fastapi import APIRouter, Query

from app.api.deps.auth import CurrentCustomer
from app.api.responses.response import ok
from app.startup.composition import get_composition

router = APIRouter(prefix="/promotions", tags=["promotions"])


@router.get("")
async def list_active(
    customer: CurrentCustomer,
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
) -> dict:
    svc = get_composition().promotion_service()
    return ok(await svc.list_active(limit, offset))


@router.post("/validate")
async def validate(
    customer: CurrentCustomer,
    code: str = Query(..., min_length=2, max_length=40),
    amount: float = Query(..., gt=0),
) -> dict:
    svc = get_composition().promotion_service()
    return ok(await svc.validate(code, amount))


@router.post("/{promo_id}/use")
async def use(promo_id: str, customer: CurrentCustomer) -> dict:
    svc = get_composition().promotion_service()
    return ok(await svc.use(promo_id), title="Promotion applied")