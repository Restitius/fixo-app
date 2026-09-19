"""Catalog domain router — browsing + discovery for authenticated customers."""
from __future__ import annotations

from fastapi import APIRouter, Query

from app.api.deps.auth import CurrentCustomer
from app.api.responses.response import ok
from app.startup.composition import get_composition

router = APIRouter(prefix="/catalog", tags=["catalog"])


@router.get("/categories")
async def categories(customer: CurrentCustomer) -> dict:
    svc = get_composition().catalog_service()
    return ok(await svc.categories())


@router.get("/search")
async def search(
    customer: CurrentCustomer,
    q: str = Query(min_length=1, max_length=60),
    limit: int = Query(default=20, ge=1, le=50),
    offset: int = Query(default=0, ge=0),
) -> dict:
    svc = get_composition().catalog_service()
    return ok(await svc.search(q, limit=limit, offset=offset))


@router.get("/suggestions")
async def suggestions(
    customer: CurrentCustomer,
    q: str = Query(default="", max_length=60),
    limit: int = Query(default=6, ge=1, le=10),
) -> dict:
    svc = get_composition().catalog_service()
    return ok(await svc.suggestions(q, limit=limit))


@router.get("/services/{slug}")
async def service_detail(slug: str, customer: CurrentCustomer) -> dict:
    svc = get_composition().catalog_service()
    return ok(await svc.service_detail(slug))