"""ProviderBillingSqlAdapter — implemented via governed queries (Phase 27).

The only code that knows PROV.BILLING.* query ids. The provider bill is a
read-only aggregation: BOOKINGS.agreed_amount (original price) +
APPROVED change-request deltas + BOOKING_MATERIALS lines, with the
standard-platform tax rate applied on top. Discounts are customer-side
(quotes/invoices); the provider view shows the pre-discount subtotal.
"""
from __future__ import annotations

from typing import Any


class ProviderBillingQueryIds:
    PREVIEW = "PROV.BILLING.PREVIEW"
    CHANGES = "PROV.BILLING.CHANGES"


class ProviderBillingSqlAdapter:
    def __init__(self, sql_query_manager: Any) -> None:
        self._sql = sql_query_manager

    async def preview(
        self, provider_id: str, booking_id: str
    ) -> dict[str, Any] | None:
        return await self._sql.execute(
            ProviderBillingQueryIds.PREVIEW,
            {"user_id": provider_id, "booking_id": booking_id},
            fetch="one",
        )

    async def changes(
        self, provider_id: str, booking_id: str
    ) -> list[dict[str, Any]]:
        rows = await self._sql.execute(
            ProviderBillingQueryIds.CHANGES,
            {"user_id": provider_id, "booking_id": booking_id},
            fetch="all",
        )
        return list(rows or [])
