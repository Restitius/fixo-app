"""Onboarding router — guided setup steps for the authenticated customer."""
from __future__ import annotations

from fastapi import APIRouter

from app.api.deps.auth import CurrentCustomer
from app.api.responses.response import ok
from app.startup.composition import get_composition

router = APIRouter(prefix="/onboarding", tags=["onboarding"])


@router.get("/steps")
async def steps() -> dict:
    return ok(await get_composition().onboarding_service().steps())


@router.get("/status")
async def status(customer: CurrentCustomer) -> dict:
    svc = get_composition().onboarding_service()
    return ok(await svc.status(str(customer["customer_id"])))


@router.post("/steps/{step_code}/complete")
async def complete_step(step_code: str, customer: CurrentCustomer) -> dict:
    svc = get_composition().onboarding_service()
    result = await svc.complete_step(str(customer["customer_id"]), step_code)
    return ok(result, title="Step completed")
