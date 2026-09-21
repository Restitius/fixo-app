"""ProviderBillingRepository — persistence port for provider final billing.

PROV.BILLING.* IDs live only in ProviderBillingSqlAdapter.
"""
from __future__ import annotations

from typing import Any, Protocol, runtime_checkable


@runtime_checkable
class ProviderBillingRepository(Protocol):
    async def preview(
        self, provider_id: str, booking_id: str
    ) -> dict[str, Any] | None: ...

    async def changes(
        self, provider_id: str, booking_id: str
    ) -> list[dict[str, Any]]: ...
