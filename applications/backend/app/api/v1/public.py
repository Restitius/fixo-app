"""Public content endpoints — no authentication required."""
from __future__ import annotations

from fastapi import APIRouter, Query

from app.api.responses.response import ok
from app.startup.composition import get_composition

router = APIRouter(prefix="/public", tags=["public"])


@router.get("/landing")
async def landing() -> dict:
    return ok(await get_composition().public_service().landing())


@router.get("/categories")
async def categories() -> dict:
    return ok(await get_composition().public_service().categories())


@router.get("/services")
async def services(category: str | None = Query(default=None)) -> dict:
    return ok(await get_composition().public_service().services(category))


@router.get("/services/search")
async def search(q: str = Query(min_length=2)) -> dict:
    return ok(await get_composition().public_service().search(q))


@router.get("/faqs")
async def faqs() -> dict:
    return ok(await get_composition().public_service().faqs())
