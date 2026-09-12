"""Provider ranking & reputation router (Requirement Phase 35).

Prefix: /providers/me/ranking

<<<<<<< HEAD
- GET /           — current provider's ranking signals (owner)
- GET /leaderboard — public top providers by rank score
=======
- GET /           current provider ranking signals (owner)
- GET /leaderboard public top providers by rank score
>>>>>>> refs/rewritten/Merge-module-provider-into-dev-Phase-36-
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
<<<<<<< HEAD
) -> Any:
    """Return the authenticated provider's current ranking signals."""
=======
) -> dict[str, Any]:
    """Return the authenticated provider current ranking signals."""
>>>>>>> refs/rewritten/Merge-module-provider-into-dev-Phase-36-
    svc = _service()
    return await svc.get_ranking(provider_id=str(provider["provider_id"]))


@router.get("/leaderboard")
async def get_leaderboard(
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
<<<<<<< HEAD
) -> Any:
    """Return the public leaderboard of top providers by rank score."""
    svc = _service()
    return await svc.get_leaderboard(limit=limit, offset=offset)
=======
) -> dict[str, Any]:
    """Return the public leaderboard of top providers by rank score."""
    svc = _service()
    return await svc.get_leaderboard(limit=limit, offset=offset)
>>>>>>> refs/rewritten/Merge-module-provider-into-dev-Phase-36-
