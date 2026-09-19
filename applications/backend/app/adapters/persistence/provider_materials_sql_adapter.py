"""ProviderMaterialsSqlAdapter — implemented via governed queries (Phase 24).

The only code that knows PROV.MATERIALS.* query ids. Material lines
(item, qty, cost, receipt/photo/invoice attachment) are stored against
the booking; the summary feeds the final invoice (Phase 27).
"""
from __future__ import annotations

from typing import Any


class ProviderMaterialsQueryIds:
    ADD = "PROV.MATERIALS.ADD"
    LIST = "PROV.MATERIALS.LIST"
    DELETE = "PROV.MATERIALS.DELETE"
    SUMMARY = "PROV.MATERIALS.SUMMARY"


class ProviderMaterialsSqlAdapter:
    def __init__(self, sql_query_manager: Any) -> None:
        self._sql = sql_query_manager

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
    ) -> dict[str, Any] | None:
        return await self._sql.execute(
            ProviderMaterialsQueryIds.ADD,
            {
                "user_id": provider_id,
                "booking_id": booking_id,
                "item_name": item_name,
                "quantity": quantity,
                "unit_cost": unit_cost,
                "amount": amount,
                "currency": currency,
                "note": note,
                "attachment_url": attachment_url,
                "attachment_kind": attachment_kind,
            },
            fetch="one",
        )

    async def list_for_booking(
        self, provider_id: str, booking_id: str
    ) -> list[dict[str, Any]]:
        rows = await self._sql.execute(
            ProviderMaterialsQueryIds.LIST,
            {"user_id": provider_id, "booking_id": booking_id},
            fetch="all",
        )
        return list(rows or [])

    async def delete(
        self, provider_id: str, material_id: str
    ) -> dict[str, Any] | None:
        return await self._sql.execute(
            ProviderMaterialsQueryIds.DELETE,
            {"user_id": provider_id, "material_id": material_id},
            fetch="one",
        )

    async def summary(
        self, provider_id: str, booking_id: str
    ) -> list[dict[str, Any]]:
        rows = await self._sql.execute(
            ProviderMaterialsQueryIds.SUMMARY,
            {"user_id": provider_id, "booking_id": booking_id},
            fetch="all",
        )
        return list(rows or [])
