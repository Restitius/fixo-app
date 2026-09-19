"""ProviderRankingSqlAdapter — SQL-backed implementation of ProviderRankingRepository.

Routes lookups through governed queries:
- PROV.RANKING.GET — provider-owned ranking fetch (ownership filter required)
- PROV.RANKING.LEADERBOARD — public top-providers listing
"""

from typing import Any

from app.ports.persistence.provider_ranking_repository import ProviderRankingRepository


class ProviderRankingSqlAdapter(ProviderRankingRepository):
    def __init__(self, queries: Any) -> None:
        self._queries = queries

    async def get(self, provider_id: str) -> Any | None:
        """Return the ranking signals for one provider, or None if not yet computed."""
        rows = await self._queries.execute(
            "PROV.RANKING.GET",
            {"user_id": provider_id},
        )
        return rows[0] if rows else None

    async def leaderboard(self, *, limit: int = 20, offset: int = 0) -> list[Any]:
        """Return top providers ordered by rank score descending."""
        return await self._queries.execute(
            "PROV.RANKING.LEADERBOARD",
            {"limit": limit, "offset": offset},
        )