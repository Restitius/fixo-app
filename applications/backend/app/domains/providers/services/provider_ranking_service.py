"""ProviderRankingService — provider ranking & reputation (Requirement Phase 35).

Exposes a provider's current ranking signals (score, level, badges, completed
jobs, recurring customers, referrals, average KPI values) and the public
leaderboard of top providers.

Rank levels: bronze -> silver -> gold -> platinum.

No computation happens in this phase — the service only reads stored ranking
values. Computation/ingestion is out of scope for Phase 35.
"""

from typing import Any

from app.shared.exceptions.hierarchy import NotFoundError

# -- rank level constants ---------------------------------------------------------
RANK_LEVELS = ("bronze", "silver", "gold", "platinum")


class ProviderRankingService:
    """Domain service for provider ranking read operations."""

    def __init__(self, ranking: Any) -> None:
        self._ranking = ranking

    async def get_ranking(self, provider_id: str) -> dict[str, Any]:
        """Return the current ranking signals for a provider.

        Raises NotFoundError when no ranking row exists for the provider.
        """
        row = await self._ranking.get(provider_id)
        if row is None:
            raise NotFoundError("provider ranking not found")
        return self._encode_ranking(row)

    async def get_leaderboard(
        self, *, limit: int = 20, offset: int = 0
    ) -> dict[str, Any]:
        """Return the public leaderboard of top providers by rank score."""
        if limit < 1 or limit > 100:
            raise ValueError("limit must be between 1 and 100")
        if offset < 0:
            raise ValueError("offset must be >= 0")
        rows = await self._ranking.leaderboard(limit=limit, offset=offset)
        return {
            "providers": [self._encode_leaderboard_entry(p) for p in rows],
            "limit": limit,
            "offset": offset,
        }

    # -- encoding helpers -----------------------------------------------------------

    @staticmethod
    def _encode_ranking(row: dict[str, Any]) -> dict[str, Any]:
        """Shape a ranking row for API output."""
        return {
            "provider_id": str(row.get("provider_id") or ""),
            "rank_score": int(row.get("rank_score") or 0),
            "rank_level": str(row.get("rank_level") or "bronze"),
            "badges": row.get("badges") or [],
            "completed_jobs": int(row.get("completed_jobs") or 0),
            "recurring_customers": int(row.get("recurring_customers") or 0),
            "referrals": int(row.get("referrals") or 0),
            "avg_completion_rate": float(row.get("avg_completion_rate") or 0),
            "avg_on_time_rate": float(row.get("avg_on_time_rate") or 0),
            "avg_rating": float(row.get("avg_rating") or 0),
            "last_computed_at": row.get("last_computed_at"),
        }

    @staticmethod
    def _encode_leaderboard_entry(row: dict[str, Any]) -> dict[str, Any]:
        """Shape a leaderboard row for API output."""
        return {
            "provider_id": str(row.get("provider_id") or ""),
            "rank_score": int(row.get("rank_score") or 0),
            "rank_level": str(row.get("rank_level") or "bronze"),
            "badges": row.get("badges") or [],
            "completed_jobs": int(row.get("completed_jobs") or 0),
            "avg_rating": float(row.get("avg_rating") or 0),
        }