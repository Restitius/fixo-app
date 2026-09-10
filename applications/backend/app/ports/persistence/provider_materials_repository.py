"""ProviderMaterialsRepository — persistence port for provider materials & expenses.

PROV.MATERIALS.* IDs live only in ProviderMaterialsSqlAdapter.
"""
from __future__ import annotations

from typing import Any, Protocol, runtime_checkable


@runtime_checkable
class ProviderMaterialsRepository(Protocol):
    async def add(
        self,
        provider_id: str,
        booking_id: str,
        item_name: str,
        quantity: float,
        unit_cost: float | None,
        amount: float,
        currency: str,
        note: str | None,
        attachment_url: str | None,
        attachment_kind: str | None,
    ) -> dict[str, Any] | None: ...

    async def list_for_booking(
        self, provider_id: str, booking_id: str
    ) -> list[dict[str, Any]]: ...

    async def delete(
        self, provider_id: str, material_id: str
    ) -> dict[str, Any] | None: ...

    async def summary(
        self, provider_id: str, booking_id: str
    ) -> list[dict[str, Any]]: ...
