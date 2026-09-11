"""ProviderEarningsRepository — persistence port for provider earnings.

PROV.EARNINGS.* IDs live only in ProviderEarningsSqlAdapter. Phase 28 reads:
the summary statistics (pending / available / total / withdrawn + windowed
earned views) and the full invoice-ledger transaction list.
"""
from __future__ import annotations

from typing import Any, Protocol, runtime_checkable


@runtime_checkable
class ProviderEarningsRepository(Protocol):
    async def summary(self, provider_id: str) -> dict[str, Any] | None: ...

    async def transactions(
        self, provider_id: str, *, limit: int = 20, offset: int = 0
    ) -> list[dict[str, Any]]: ...