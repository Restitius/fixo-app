"""Provider onboarding router — guided 7-step setup (Requirement Phase 2).

Mounted under /providers/onboarding and guarded by the provider principal
(CurrentProvider); all progress queries are ownership-scoped to the token's
provider_id.
"""
from __future__ import annotations

from typing import Any

from fastapi import APIRouter
from pydantic import BaseModel

from app.api.deps.provider_auth import CurrentProvider
from app.api.responses.response import ok
from app.startup.composition import get_composition

router = APIRouter(prefix="/providers/onboarding", tags=["providers"])


class StepDataRequest(BaseModel):
    data: dict[str, Any] = {}


@router.get("/steps")
async def steps() -> dict:
    return ok(await get_composition().provider_onboarding_service().steps())


@router.get("/status")
async def status(provider: CurrentProvider) -> dict:
    svc = get_composition().provider_onboarding_service()
    return ok(await svc.status(str(provider["provider_id"])))


@router.put("/steps/{step_code}")
async def save_step(step_code: str, payload: StepDataRequest, provider: CurrentProvider) -> dict:
    svc = get_composition().provider_onboarding_service()
    result = await svc.save_step(str(provider["provider_id"]), step_code, payload.data)
    return ok(result, title="Progress saved")


@router.post("/steps/{step_code}/complete")
async def complete_step(step_code: str, payload: StepDataRequest, provider: CurrentProvider) -> dict:
    svc = get_composition().provider_onboarding_service()
    result = await svc.complete_step(str(provider["provider_id"]), step_code, payload.data)
    return ok(result, title="Step completed")
