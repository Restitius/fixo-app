"""ProviderWalletSqlAdapter — implemented via governed queries (Phase 29).

The only code that knows PROV.WALLET.* query ids. Read surface only:
get-or-create the wallet, the seven-statistic summary, and the full
transaction ledger. Ledger writes arrive from payout processing (Phase 30)
through a write-only adapter in that module.
"""
from __future__ import annotations

from typing import Any


class ProviderWalletQueryIds:
    GET_OR_CREATE = "PROV.WALLET.GET_OR_CREATE"
    SUMMARY = "PROV.WALLET.SUMMARY"
    LEDGER = "PROV.WALLET.LEDGER"


class ProviderWalletSqlAdapter:
    def __init__(self, sql_query_manager: Any) -> None:
        self._sql = sql_query_manager

    async def get_or_create(self, provider_id: str) -> dict[str, Any] | None:
        return await self._sql.execute(
            ProviderWalletQueryIds.GET_OR_CREATE,
            {"user_id": provider_id},
            fetch="one",
        )

    async def summary(self, provider_id: str) -> dict[str, Any] | None:
        return await self._sql.execute(
            ProviderWalletQueryIds.SUMMARY,
            {"user_id": provider_id},
            fetch="one",
        )

    async def ledger(
        self, provider_id: str, *, limit: int = 20, offset: int = 0
    ) -> list[dict[str, Any]]:
        rows = await self._sql.execute(
            ProviderWalletQueryIds.LEDGER,
            {"user_id": provider_id, "limit": limit, "offset": offset},
            fetch="all",
        )
        return list(rows or [])