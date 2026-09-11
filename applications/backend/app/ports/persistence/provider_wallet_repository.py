"""ProviderWalletRepository — persistence port for provider wallet.

PROV.WALLET.* IDs live only in ProviderWalletSqlAdapter. Phase 29 reads:
get-or-create the wallet row, the seven-statistic summary, and the full
transaction history. Writes (EARNING/COMMISSION/WITHDRAWAL/... ledger
entries) land during Phase 30 payout processing.
"""
from __future__ import annotations

from typing import Any, Protocol, runtime_checkable


@runtime_checkable
class ProviderWalletRepository(Protocol):
    async def get_or_create(self, provider_id: str) -> dict[str, Any] | None: ...

    async def summary(self, provider_id: str) -> dict[str, Any] | None: ...

    async def ledger(
        self, provider_id: str, *, limit: int = 20, offset: int = 0
    ) -> list[dict[str, Any]]: ...