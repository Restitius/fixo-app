"""Matching domain router — Modules 12 & 13 endpoints."""
from __future__ import annotations

from fastapi import APIRouter

from app.api.deps.auth import CurrentCustomer
from app.api.responses.response import ok
from app.startup.composition import get_composition

router = APIRouter(prefix="/service-requests/{request_id}", tags=["matching"])


@router.post("/match")
async def run_matching(request_id: str, customer: CurrentCustomer) -> dict:
    svc = get_composition().matching_service()
    result = await svc.run_matching(str(customer["customer_id"]), request_id)
    return ok(result, title=f"Matched via {result['strategy']}")


@router.get("/matches")
async def list_matches(request_id: str, customer: CurrentCustomer) -> dict:
    svc = get_composition().matching_service()
    return ok(await svc.list_matches(str(customer["customer_id"]), request_id))


@router.post("/select-provider")
async def select_provider(
    request_id: str, customer: CurrentCustomer,
    body: dict | None = None,
) -> dict:
    provider_id = (body or {}).get("provider_id", "")
    if not provider_id:
        from app.shared.exceptions.hierarchy import ValidationError

        raise ValidationError("provider_id is required")
    svc = get_composition().matching_service()
    result = await svc.select_provider(
        str(customer["customer_id"]), request_id, str(provider_id)
    )
    return ok(result, title="Provider selected")