"""ProviderRecurringCustomersSqlAdapter - the only layer that knows the PROV.RECURRING_CUSTOMERS.* IDs."""
from __future__ import annotations

from typing import Any

from app.ports.persistence.provider_recurring_customers_repository import (
    ProviderRecurringCustomersRepositoryPort,
)

_LIMIT_CAP = 100


class ProviderRecurringCustomersSqlAdapter(ProviderRecurringCustomersRepositoryPort):
    def __init__(self, queries: Any) -> None:
        self._queries = queries

    async def list_customers(
        self, provider_id: str, *, limit: int = 20, offset: int = 0
    ) -> list[dict[str, Any]]:
        return await self._queries.execute(
            "PROV.RECURRING_CUSTOMERS.LIST",
            {
                "user_id": provider_id,
                "limit": max(1, min(limit, _LIMIT_CAP)),
                "offset": max(offset, 0),
            },
        )

    async def get_customer(self, provider_id: str, *, customer_id: str) -> dict[str, Any] | None:
        rows = await self._queries.execute(
            "PROV.RECURRING_CUSTOMERS.GET",
            {"user_id": provider_id, "customer_id": customer_id},
        )
        return rows[0] if rows else None

    async def list_bookings(
        self, provider_id: str, *, customer_id: str, limit: int = 20, offset: int = 0
    ) -> list[dict[str, Any]]:
        return await self._queries.execute(
            "PROV.RECURRING_CUSTOMERS.BOOKINGS",
            {
                "user_id": provider_id,
                "customer_id": customer_id,
                "limit": max(1, min(limit, _LIMIT_CAP)),
                "offset": max(offset, 0),
            },
        )

    async def set_note(
        self, provider_id: str, *, customer_id: str, note: str
    ) -> dict[str, Any] | None:
        rows = await self._queries.execute(
            "PROV.RECURRING_CUSTOMERS.NOTE.SET",
            {"provider_id": provider_id, "customer_id": customer_id, "note": note},
        )
        return rows[0] if rows else None
