"""RequestSqlAdapter — implements ServiceRequestRepository via governed queries.

This is the ONLY place CUS.REQUEST.{CREATE,GET,LIST,UPDATE,SET_STATUS} appear.
"""
from __future__ import annotations

from typing import Any

from app.platform.query.sql_query_manager import SQLQueryManager


class RequestQueryIds:
    CREATE = "CUS.REQUEST.CREATE"
    GET = "CUS.REQUEST.GET"
    LIST = "CUS.REQUEST.LIST"
    UPDATE_DRAFT = "CUS.REQUEST.UPDATE"
    SET_STATUS = "CUS.REQUEST.SET_STATUS"
    SET_PROVIDER = "CUS.REQUEST.SET_PROVIDER"


class RequestSqlAdapter:
    def __init__(self, sql_manager: SQLQueryManager) -> None:
        self._sql = sql_manager

    async def create(self, customer_id: str, params: dict[str, Any]) -> dict[str, Any] | None:
        return await self._sql.execute(
            RequestQueryIds.CREATE,
            {
                "customer_id": customer_id,
                "service_id": params.get("service_id"),
                "property_id": params.get("property_id") or "",
                "address_id": params.get("address_id") or "",
                "description": params.get("description"),
                # Dates arrive as 'YYYY-MM-DD' strings from the API layer.
                "preferred_date": params.get("preferred_date") or "",
                "time_window": params.get("time_window") or "",
            },
            fetch="one",
        )

    async def get(self, customer_id: str, request_id: str) -> dict[str, Any] | None:
        return await self._sql.execute(
            RequestQueryIds.GET,
            {"customer_id": customer_id, "request_id": request_id},
            fetch="one",
        )

    async def list(
        self, customer_id: str, *, status: str | None = None,
        limit: int = 20, offset: int = 0
    ) -> list[dict[str, Any]]:
        rows = await self._sql.execute(
            RequestQueryIds.LIST,
            {"customer_id": customer_id, "status": status,
             "limit": limit, "offset": offset},
            fetch="all",
        )
        return list(rows or [])

    async def update_draft(
        self, customer_id: str, request_id: str, params: dict[str, Any]
    ) -> dict[str, Any] | None:
        p = {
            "description": params.get("description"),
            "preferred_date": params.get("preferred_date") or "",
            "time_window": params.get("time_window") or "",
            "address_id": params.get("address_id") or "",
            "property_id": params.get("property_id") or "",
            "clear_schedule": bool(params.get("_clear_schedule")),
            "clear_address": bool(params.get("_clear_address")),
            "clear_property": bool(params.get("_clear_property")),
        }
        return await self._sql.execute(
            RequestQueryIds.UPDATE_DRAFT,
            {"customer_id": customer_id, "request_id": request_id, **p},
            fetch="one",
        )

    async def set_status(
        self, customer_id: str, request_id: str,
        *, from_state: str, to_state: str, notes: str | None = None
    ) -> dict[str, Any] | None:
        row = await self._sql.execute(
            RequestQueryIds.SET_STATUS,
            {"customer_id": customer_id, "request_id": request_id,
             "from_state": from_state, "to_state": to_state, "notes": notes},
            fetch="one",
        )
        # NULL row == guard failed (state moved underneath us).
        return row

    async def set_provider(self, customer_id: str, request_id: str, provider_id: str) -> dict[str, Any] | None:
        return await self._sql.execute(
            RequestQueryIds.SET_PROVIDER,
            {"customer_id": customer_id, "request_id": request_id,
             "provider_id": provider_id},
            fetch="one",
        )