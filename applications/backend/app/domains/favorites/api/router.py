"""Favorites domain router — Phase 10 module 30."""
from __future__ import annotations

from fastapi import APIRouter, Query

from app.api.deps.auth import CurrentCustomer
from app.api.responses.response import ok
from app.startup.composition import get_composition

router = APIRouter(prefix="/favorites", tags=["favorites"])


@router.post("/{provider_id}/toggle")
async def toggle_favorite(provider_id: str, customer: CurrentCustomer) -> dict:
    svc = get_composition().favorite_service()
    return ok(await svc.toggle(str(customer["customer_id"]), provider_id),
              title="Favorite status updated")


@router.get("")
async def list_favorites(
    customer: CurrentCustomer,
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=10, ge=1, le=20),
) -> dict:
    svc = get_composition().favorite_service()
    return ok(await svc.list(str(customer["customer_id"]), page, limit))
