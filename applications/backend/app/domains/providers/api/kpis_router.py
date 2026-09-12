"""Provider performance KPIs router (Requirement Phase 34).

Prefix: /providers/me/kpis

<<<<<<< HEAD
- GET /        — list KPIs (optional period filter: weekly/monthly/quarterly/yearly)
- GET /summary — KPI totals across all periods
=======
- GET /        list KPIs (optional period filter: weekly/monthly/quarterly/yearly)
- GET /summary KPI totals across all periods
>>>>>>> refs/rewritten/Merge-module-provider-into-dev-Phase-36-
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


def _service() -> ProviderKpisService:
    return get_composition().provider_kpis_service()


@router.get("/")
async def list_kpis(
    period: str | None = Query(None, pattern="weekly|monthly|quarterly|yearly"),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    provider: dict = Depends(get_current_provider),
<<<<<<< HEAD
) -> list[Any]:
=======
) -> dict[str, Any]:
>>>>>>> refs/rewritten/Merge-module-provider-into-dev-Phase-36-
    """List provider KPIs, optionally filtered by period."""
    svc = _service()
    return await svc.list_kpis(
        provider_id=str(provider["provider_id"]),
        period=period,
        limit=limit,
        offset=offset,
    )


@router.get("/summary")
async def get_summary(
    provider: dict = Depends(get_current_provider),
<<<<<<< HEAD
) -> Any:
    """Return provider KPI totals across all periods."""
    svc = _service()
    return await svc.get_summary(provider_id=str(provider["provider_id"]))
=======
) -> dict[str, Any]:
    """Return provider KPI totals across all periods."""
    svc = _service()
    return await svc.get_summary(provider_id=str(provider["provider_id"]))
>>>>>>> refs/rewritten/Merge-module-provider-into-dev-Phase-36-
