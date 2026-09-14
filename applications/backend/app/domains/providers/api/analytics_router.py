"""Provider analytics router - Phase 49.

Prefix: /providers/me/analytics
"""
from __future__ import annotations

from fastapi import APIRouter, Query

from app.api.deps.provider_auth import CurrentProvider
from app.api.responses.response import ok
from app.startup.composition import get_composition

router = APIRouter(prefix="/providers/me/analytics", tags=["provider-analytics"])


@router.get("/overview")
async def overview(
    provider: CurrentProvider,
    months: int = Query(6, ge=1, le=24),
) -> dict:
    svc = get_composition().provider_analytics_service()
    return ok(await svc.overview(str(provider["provider_id"]), months=months))
