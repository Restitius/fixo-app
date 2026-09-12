"""Provider ranking & reputation router (Requirement Phase 35).

Prefix: /providers/me/ranking

- GET /           — current provider's ranking signals (owner)
- GET /leaderboard — public top providers by rank score
"""

from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends, Query

from app.api.deps.provider_auth import get_current_provider
from app.domains.providers.services.provider_ranking_service import (
    ProviderRankingService,
)
from app.startup.composition import get_composition

router = APIRouter(prefix="/providers/me/ranking", tags=["provider-ranking"])


def _service() -> ProviderRankingService:
    return get_composition().provider_ranking_service()


@router.get("/")
async def get_ranking(
    provider: dict = Depends(get_current_provider),
) -> Any:
    """Return the authenticated provider's current ranking signals."""
    svc = _service()
    return await svc.get_ranking(provider_id=str(provider["provider_id"]))


@router.get("/leaderboard")
async def get_leaderboard(
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
) -> Any:
    """Return the public leaderboard of top providers by rank score."""
    svc = _service()
    return await svc.get_leaderboard(limit=limit, offset=offset)