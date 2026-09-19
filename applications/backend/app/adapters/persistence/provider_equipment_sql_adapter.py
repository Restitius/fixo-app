"""ProviderEquipmentSqlAdapter - the only layer that knows the PROV.EQUIPMENT.* IDs."""
from __future__ import annotations

from datetime import date
from typing import Any

from sqlalchemy.exc import IntegrityError

from app.ports.persistence.provider_equipment_repository import ProviderEquipmentRepositoryPort
from app.shared.exceptions.hierarchy import ConflictError

_LIMIT_CAP = 100


class ProviderEquipmentSqlAdapter(ProviderEquipmentRepositoryPort):
    def __init__(self, queries: Any) -> None:
        self._queries = queries

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
        try:
            rows = await self._queries.execute(
                "PROV.EQUIPMENT.CREATE",
                {
                    "provider_id": provider_id,
                    "name": name,
                    "category": category,
                    "serial_number": serial_number,
                    "condition": condition,
                    "purchase_date": purchase_date,
                    "notes": notes,
                },
            )
        except IntegrityError as exc:
            raise ConflictError("Equipment rejected by data constraints") from exc
        return rows[0] if rows else None

    async def list_equipment(
        self,
        provider_id: str,
        *,
        status: str | None = None,
        category: str | None = None,
        limit: int = 20,
        offset: int = 0,
    ) -> list[dict[str, Any]]:
        return await self._queries.execute(
            "PROV.EQUIPMENT.LIST",
            {
                "user_id": provider_id,
                "status": status,
                "category": category,
                "limit": max(1, min(limit, _LIMIT_CAP)),
                "offset": max(offset, 0),
            },
        )

    async def get(self, provider_id: str, *, equipment_id: str) -> dict[str, Any] | None:
        rows = await self._queries.execute(
            "PROV.EQUIPMENT.GET",
            {"user_id": provider_id, "equipment_id": equipment_id},
        )
        return rows[0] if rows else None

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
        try:
            rows = await self._queries.execute(
                "PROV.EQUIPMENT.UPDATE",
                {
                    "user_id": provider_id,
                    "equipment_id": equipment_id,
                    "name": name,
                    "category": category,
                    "serial_number": serial_number,
                    "condition": condition,
                    "status": status,
                    "notes": notes,
                },
            )
        except IntegrityError as exc:
            raise ConflictError("Update rejected by data constraints") from exc
        return rows[0] if rows else None

    async def assign(
        self, provider_id: str, *, equipment_id: str, member_id: str | None
    ) -> dict[str, Any] | None:
        rows = await self._queries.execute(
            "PROV.EQUIPMENT.ASSIGN",
            {"user_id": provider_id, "equipment_id": equipment_id, "member_id": member_id},
        )
        return rows[0] if rows else None

    async def retire(self, provider_id: str, *, equipment_id: str) -> dict[str, Any] | None:
        rows = await self._queries.execute(
            "PROV.EQUIPMENT.RETIRE",
            {"user_id": provider_id, "equipment_id": equipment_id},
        )
        return rows[0] if rows else None
