"""Provider equipment persistence port - business-facing contract only."""
from __future__ import annotations

from datetime import date
from typing import Any, Protocol


class ProviderEquipmentRepositoryPort(Protocol):
    async def create(
        self,
        provider_id: str,
        *,
        name: str,
        category: str,
        serial_number: str | None,
        condition: str,
        purchase_date: date | None,
        notes: str | None,
    ) -> dict[str, Any] | None:
        ...

    async def list_equipment(
        self,
        provider_id: str,
        *,
        status: str | None = None,
        category: str | None = None,
        limit: int = 20,
        offset: int = 0,
    ) -> list[dict[str, Any]]:
        ...

    async def get(self, provider_id: str, *, equipment_id: str) -> dict[str, Any] | None:
        ...

    async def update(
        self,
        provider_id: str,
        *,
        equipment_id: str,
        name: str | None = None,
        category: str | None = None,
        serial_number: str | None = None,
        condition: str | None = None,
        status: str | None = None,
        notes: str | None = None,
    ) -> dict[str, Any] | None:
        ...

    async def assign(
        self, provider_id: str, *, equipment_id: str, member_id: str | None
    ) -> dict[str, Any] | None:
        ...

    async def retire(self, provider_id: str, *, equipment_id: str) -> dict[str, Any] | None:
        ...
