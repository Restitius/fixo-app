"""PropertySqlAdapter — implements PropertyRepository via governed queries.

This is the ONLY place CUS.PROPERTY.* IDs appear.
"""
from __future__ import annotations

from typing import Any

from app.platform.query.sql_query_manager import SQLQueryManager


class PropertyQueryIds:
    LIST = "CUS.PROPERTY.LIST"
    GET = "CUS.PROPERTY.GET"
    CREATE = "CUS.PROPERTY.CREATE"
    UPDATE = "CUS.PROPERTY.UPDATE"
    DELETE = "CUS.PROPERTY.DELETE"
    ROOMS_ADD = "CUS.PROPERTY.ROOMS.ADD"
    ROOMS_REMOVE = "CUS.PROPERTY.ROOMS.REMOVE"


class PropertySqlAdapter:
    def __init__(self, sql_manager: SQLQueryManager) -> None:
        self._sql = sql_manager

    async def list(self, customer_id: str) -> list[dict[str, Any]]:
        rows = await self._sql.execute(
            PropertyQueryIds.LIST, {"customer_id": customer_id}, fetch="all"
        )
        return list(rows or [])

    async def get(self, customer_id: str, property_id: str) -> dict[str, Any] | None:
        row = await self._sql.execute(
            PropertyQueryIds.GET,
            {"customer_id": customer_id, "property_id": property_id},
            fetch="one",
        )
        # json_agg arrives as a JSON string on some drivers — normalise once.
        if isinstance(row, dict) and isinstance(row.get("rooms"), str):
            import json

            row["rooms"] = json.loads(row["rooms"])
        return row

    async def create(self, customer_id: str, params: dict[str, Any]) -> dict[str, Any] | None:
        return await self._sql.execute(
            PropertyQueryIds.CREATE,
            {
                "customer_id": customer_id,
                "name": params.get("name"),
                "property_type": params.get("property_type") or "HOUSE",
                "address_id": params.get("address_id"),
                "bedrooms": params.get("bedrooms"),
                "bathrooms": params.get("bathrooms"),
                "year_built": params.get("year_built"),
                "notes": params.get("notes"),
            },
            fetch="one",
        )

    async def update(
        self, customer_id: str, property_id: str, params: dict[str, Any]
    ) -> dict[str, Any] | None:
        editable = ("name", "property_type", "bedrooms", "bathrooms", "year_built", "notes")
        payload = {k: params[k] for k in editable if k in params}

        # Address-link contract: '__CLEAR__' unlinks; a value re-links; absent
        # keys leave the current link untouched.
        addr = params.get("address_id")
        payload["clear_address"] = addr == "__CLEAR__"
        payload["address_id"] = "" if addr in (None, "__CLEAR__") else str(addr)

        return await self._sql.execute(
            PropertyQueryIds.UPDATE,
            {"customer_id": customer_id, "property_id": property_id, **payload},
            fetch="one",
        )

    async def delete(self, customer_id: str, property_id: str) -> bool:
        row = await self._sql.execute(
            PropertyQueryIds.DELETE,
            {"customer_id": customer_id, "property_id": property_id},
            fetch="one",
        )
        return bool(row)

    async def add_room(
        self, customer_id: str, property_id: str, params: dict[str, Any]
    ) -> dict[str, Any] | None:
        return await self._sql.execute(
            PropertyQueryIds.ROOMS_ADD,
            {
                "customer_id": customer_id,
                "property_id": property_id,
                "room_type": params.get("room_type"),
                "name": params.get("name"),
                "notes": params.get("notes"),
            },
            fetch="one",
        )

    async def remove_room(self, customer_id: str, room_id: str) -> bool:
        row = await self._sql.execute(
            PropertyQueryIds.ROOMS_REMOVE,
            {"customer_id": customer_id, "room_id": room_id},
            fetch="one",
        )
        return bool(row)