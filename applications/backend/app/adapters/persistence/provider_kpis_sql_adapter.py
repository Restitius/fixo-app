
from __future__ import annotations

from typing import Any

from app.ports.persistence.provider_kpis_repository import ProviderKpisRepository


class ProviderKpisSqlAdapter(ProviderKpisRepository):
    def __init__(self, queries: Any) -> None:
        self._queries = queries

    async def list(
        self,
        provider_id: str,
        *,
        period: str | None = None,
        limit: int = 50,
        offset: int = 0,
    ) -> list[Any]:
        return await self._queries.execute(
            "PROV.KPIS.LIST",
            {"user_id": provider_id, "period": period, "limit": limit, "offset": offset},
        )

    async def summary(self, provider_id: str) -> Any:
        rows = await self._queries.execute(
            "PROV.KPIS.SUMMARY",
            {"user_id": provider_id},
        )
        return rows[0] if rows else None