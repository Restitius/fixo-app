"""Provider ranking & reputation router (Requirement Phase 35).

Prefix: /providers/me/ranking

- GET /        — current provider's ranking signals
- GET /leaderboard — public top providers by rank score
"""

from typing import Any

from fastapi import APIRouter, Query

from app.shared.runtime.request_context import RequestContext


def make_provider_ranking_router(*, service: Any, ctx: Any) -> APIRouter:
    r = APIRouter(prefix="/providers/me/ranking", tags=["provider-ranking"])

    @r.get("/")
    async def get_ranking(
        ctx: RequestContext = ctx,
    ) -> Any:
        """Return the authenticated provider's current ranking signals."""
        return await service.get_ranking(ctx.user_id)

    @r.get("/leaderboard")
    async def get_leaderboard(
        limit: int = Query(20, ge=1, le=100),
        offset: int = Query(0, ge=0),
    ) -> Any:
        """Return the public leaderboard of top providers by rank score."""
        return await service.get_leaderboard(limit=limit, offset=offset)

    return r