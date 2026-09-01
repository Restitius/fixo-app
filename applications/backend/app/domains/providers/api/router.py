"""Provider directory router — Module 14 endpoints."""
from __future__ import annotations

from fastapi import APIRouter, Query

from app.api.deps.auth import CurrentCustomer
from app.api.responses.response import ok
from app.startup.composition import get_composition

router = APIRouter(prefix="/providers", tags=["providers"])


@router.get("")
async def list_by_service(
    customer: CurrentCustomer, service: str = Query(min_length=1, max_length=160)
) -> dict:
    svc = get_composition().provider_directory_service()
    return ok(await svc.by_service(service))


@router.get("/{provider_id}")
async def profile(provider_id: str, customer: CurrentCustomer) -> dict:
    svc = get_composition().provider_directory_service()
    return ok(await svc.profile(provider_id))