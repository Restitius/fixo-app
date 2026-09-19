"""ProviderRecurringCustomersService - business rules for the provider's repeat customers."""
from __future__ import annotations

from typing import Any

from app.ports.persistence.provider_recurring_customers_repository import (
    ProviderRecurringCustomersRepositoryPort,
)
from app.shared.exceptions.hierarchy import NotFoundError


class ProviderRecurringCustomersService:
    def __init__(self, repository: ProviderRecurringCustomersRepositoryPort) -> None:
        self._repo = repository

    async def list_customers(
        self, provider_id: str, *, limit: int = 20, offset: int = 0
    ) -> list[dict[str, Any]]:
        return await self._repo.list_customers(provider_id, limit=limit, offset=offset)

    async def get_customer(self, provider_id: str, *, customer_id: str) -> dict[str, Any]:
        customer = await self._repo.get_customer(provider_id, customer_id=customer_id)
        if customer is None:
            raise NotFoundError("No completed bookings with this customer")
        return customer

    async def list_bookings(
        self, provider_id: str, *, customer_id: str, limit: int = 20, offset: int = 0
    ) -> list[dict[str, Any]]:
        await self.get_customer(provider_id, customer_id=customer_id)
        return await self._repo.list_bookings(
            provider_id, customer_id=customer_id, limit=limit, offset=offset
        )

    async def set_note(self, provider_id: str, *, customer_id: str, note: str) -> dict[str, Any]:
        note = (note or "").strip()
        if not 1 <= len(note) <= 2000:
            raise ValueError("Note must be 1-2000 characters")
        result = await self._repo.set_note(provider_id, customer_id=customer_id, note=note)
        if result is None:
            raise NotFoundError("No completed bookings with this customer")
        return result
