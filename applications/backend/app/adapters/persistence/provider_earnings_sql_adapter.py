"""ProviderEarningsSqlAdapter — implemented via governed queries (Phase 28).

The only code that knows PROV.EARNINGS.* query ids. Read-only aggregation
over INVOICES (the platform's money event): a PAID invoice is an available
earning, ISSUED/DRAFT is pending, and every invoice row is a transaction.
"""
from __future__ import annotations

from typing import Any


class ProviderEarningsQueryIds:
    SUMMARY = "PROV.EARNINGS.SUMMARY"
    TRANSACTIONS = "PROV.EARNINGS.TRANSACTIONS"


class ProviderEarningsSqlAdapter:
    def __init__(self, sql_query_manager: Any) -> None:
        self._sql = sql_query_manager

    async def summary(self, provider_id: str) -> dict[str, Any] | None:
        return await self._sql.execute(
            ProviderEarningsQueryIds.SUMMARY,
            {"user_id": provider_id},
            fetch="one",
        )

    async def transactions(
        self, provider_id: str, *, limit: int = 20, offset: int = 0
    ) -> list[dict[str, Any]]:
        rows = await self._sql.execute(
            ProviderEarningsQueryIds.TRANSACTIONS,
            {"user_id": provider_id, "limit": limit, "offset": offset},
            fetch="all",
        )
        return list(rows or [])