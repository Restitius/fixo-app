"""Provider earnings router (Phase 28).

Prefix: /providers/me/earnings

- GET /summary        statistics (available / pending / total / withdrawn +
                      today / week / month / year views)
- GET /transactions   the full earnings transaction ledger (invoice events)
"""
from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends

from app.api.deps.provider_auth import get_current_provider
from app.domains.providers.services.provider_earnings_service import (
    ProviderEarningsService,
)
from app.startup.composition import get_composition

router = APIRouter(prefix="/providers/me/earnings", tags=["provider-earnings"])


def _service() -> ProviderEarningsService:
    return get_composition().provider_earnings_service()


@router.get("/summary")
async def earnings_summary(
    provider: dict = Depends(get_current_provider),
) -> dict[str, Any]:
    svc = _service()
    return await svc.summary(provider_id=str(provider["provider_id"]))


@router.get("/transactions")
async def earnings_transactions(
    limit: int = 20,
    offset: int = 0,
    provider: dict = Depends(get_current_provider),
) -> dict[str, Any]:
    svc = _service()
    return await svc.transactions(
        provider_id=str(provider["provider_id"]),
        limit=limit,
        offset=offset,
    )