"""Provider directory router — Module 14 endpoints."""
from __future__ import annotations

from fastapi import APIRouter, HTTPException, Query

from app.api.deps.auth import CurrentCustomer
from app.api.responses.response import ok
from app.startup.composition import get_composition

router = APIRouter(prefix="/providers", tags=["providers"])


@router.get("")
async def list_providers(
    customer: CurrentCustomer,
    service: str | None = Query(default=None, min_length=1, max_length=160),
    category_id: str | None = Query(default=None, min_length=1, max_length=64),
) -> dict:
    svc = get_composition().provider_directory_service()
    if category_id:
        return ok(await svc.by_category(category_id))
    if service:
        return ok(await svc.by_service(service))
    raise HTTPException(status_code=422, detail="Provide either 'service' or 'category_id'")


@router.get("/{provider_id}")
async def profile(provider_id: str, customer: CurrentCustomer) -> dict:
    svc = get_composition().provider_directory_service()
    return ok(await svc.profile(provider_id))