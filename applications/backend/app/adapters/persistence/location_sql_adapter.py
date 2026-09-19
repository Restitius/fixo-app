"""LocationSqlAdapter — implements AddressRepository via governed queries.

This is the ONLY place CUS.LOCATION.* IDs appear.
"""
from __future__ import annotations

from typing import Any

from app.platform.query.sql_query_manager import SQLQueryManager


class LocationQueryIds:
    LIST = "CUS.LOCATION.ADDRESS.LIST"
    GET = "CUS.LOCATION.ADDRESS.GET"
    CREATE = "CUS.LOCATION.ADDRESS.CREATE"
    UPDATE = "CUS.LOCATION.ADDRESS.UPDATE"
    DELETE = "CUS.LOCATION.ADDRESS.DELETE"
    SET_DEFAULT = "CUS.LOCATION.ADDRESS.SET_DEFAULT"

# Fields accepted by create/update; anything else is dropped at the boundary.
EDITABLE = (
    "label", "recipient_name", "phone", "street_address", "city",
    "region", "postal_code", "latitude", "longitude", "delivery_instructions",
)


class LocationSqlAdapter:
    def __init__(self, sql_manager: SQLQueryManager) -> None:
        self._sql = sql_manager

    async def list(self, customer_id: str) -> list[dict[str, Any]]:
        rows = await self._sql.execute(
            LocationQueryIds.LIST, {"customer_id": customer_id}, fetch="all"
        )
        return list(rows or [])

    async def get(self, customer_id: str, address_id: str) -> dict[str, Any] | None:
        return await self._sql.execute(
            LocationQueryIds.GET,
            {"customer_id": customer_id, "address_id": address_id},
            fetch="one",
        )

    async def create(self, customer_id: str, params: dict[str, Any]) -> dict[str, Any] | None:
        payload = {k: params.get(k) for k in EDITABLE}
        payload["is_default"] = bool(params.get("is_default"))
        return await self._sql.execute(
            LocationQueryIds.CREATE, {"customer_id": customer_id, **payload}, fetch="one"
        )

    async def update(
        self, customer_id: str, address_id: str, params: dict[str, Any]
    ) -> dict[str, Any] | None:
        payload = {k: params.get(k) for k in EDITABLE if k in params}
        return await self._sql.execute(
            LocationQueryIds.UPDATE,
            {"customer_id": customer_id, "address_id": address_id, **payload},
            fetch="one",
        )

    async def delete(self, customer_id: str, address_id: str) -> bool:
        row = await self._sql.execute(
            LocationQueryIds.DELETE,
            {"customer_id": customer_id, "address_id": address_id},
            fetch="one",
        )
        return bool(row)

    async def set_default(self, customer_id: str, address_id: str) -> bool:
        row = await self._sql.execute(
            LocationQueryIds.SET_DEFAULT,
            {"customer_id": customer_id, "address_id": address_id},
            fetch="one",
        )
        # SP returns a single 'ok' boolean column.
        return bool(row and row.get("ok"))