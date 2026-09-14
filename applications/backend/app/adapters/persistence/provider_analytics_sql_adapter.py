"""ProviderAnalyticsSqlAdapter - the only layer that knows the PROV.ANALYTICS.* IDs."""
from __future__ import annotations

from typing import Any

from app.ports.persistence.provider_analytics_repository import ProviderAnalyticsRepositoryPort


class ProviderAnalyticsSqlAdapter(ProviderAnalyticsRepositoryPort):
    def __init__(self, queries: Any) -> None:
        self._queries = queries

    async def overview(self, provider_id: str, *, months: int) -> list[dict[str, Any]]:
        return await self._queries.execute(
            "PROV.ANALYTICS.OVERVIEW",
            {"user_id": provider_id, "months": months},
        )
