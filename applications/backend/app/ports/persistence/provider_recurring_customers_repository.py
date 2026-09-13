"""Provider recurring-customers persistence port - business-facing contract only."""
from __future__ import annotations

from typing import Any, Protocol


class ProviderRecurringCustomersRepositoryPort(Protocol):
    async def list_customers(
        self, provider_id: str, *, limit: int = 20, offset: int = 0
    ) -> list[dict[str, Any]]:
        ...

    async def get_customer(self, provider_id: str, *, customer_id: str) -> dict[str, Any] | None:
        ...

    async def list_bookings(
        self, provider_id: str, *, customer_id: str, limit: int = 20, offset: int = 0
    ) -> list[dict[str, Any]]:
        ...

    async def set_note(
        self, provider_id: str, *, customer_id: str, note: str
    ) -> dict[str, Any] | None:
        ...
