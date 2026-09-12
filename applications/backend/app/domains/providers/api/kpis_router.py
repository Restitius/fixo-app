"""Provider performance KPIs router (Requirement Phase 34).

Prefix: /providers/me/kpis

- GET /        — list KPIs (optional period filter: weekly/monthly/quarterly/yearly)
- GET /summary — KPI totals across all periods
"""

from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends, Query

from app.api.deps.provider_auth import get_current_provider
from app.domains.providers.services.provider_kpis_service import (
    ProviderKpisService,
)
from app.startup.composition import get_composition

router = APIRouter(prefix="/providers/me/kpis", tags=["provider-kpis"])


def _service(
    provider_id: str = Depends(get_current_provider),
) -> ProviderKpisService:
    return get_composition().provider_kpis_service(provider_id=provider_id)


@router.get("/")
async def list_kpis(
    period: str | None = Query(None, pattern="weekly|monthly|quarterly|yearly"),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    svc: ProviderKpisService = Depends(_service),
) -> list[Any]:
    """List provider KPIs, optionally filtered by period."""
    return await svc.list_kpis(period=period, limit=limit, offset=offset)


@router.get("/summary")
async def get_summary(
    svc: ProviderKpisService = Depends(_service),
) -> Any:
    """Return provider KPI totals across all periods."""
    return await svc.get_summary()