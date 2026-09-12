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


def _service(
    provider_id: str = Depends(get_current_provider),
) -> ProviderRankingService:
    return get_composition().provider_ranking_service(provider_id=provider_id)


@router.get("/")
async def get_ranking(
    svc: ProviderRankingService = Depends(_service),
) -> Any:
    """Return the authenticated provider's current ranking signals."""
    return await svc.get_ranking()


@router.get("/leaderboard")
async def get_leaderboard(
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
) -> Any:
    """Return the public leaderboard of top providers by rank score."""
    svc = get_composition().provider_ranking_service(provider_id="")
    return await svc.get_leaderboard(limit=limit, offset=offset)