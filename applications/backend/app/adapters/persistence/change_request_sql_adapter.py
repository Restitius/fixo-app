"""ChangeRequestSqlAdapter — implements ChangeRequestRepository via governed queries."""
from __future__ import annotations

from typing import Any

from app.platform.query.sql_query_manager import SQLQueryManager


class ChangeQueryIds:
    CREATE = "CUS.CHANGE.CREATE"
    LIST = "CUS.CHANGE.LIST"
    GET_OWNED = "CUS.CHANGE.GET_OWNED"
    DECIDE = "CUS.CHANGE.DECIDE"


class ChangeRequestSqlAdapter:
    def __init__(self, sql_manager: SQLQueryManager) -> None:
        self._sql = sql_manager

    async def create(
        self, customer_id: str, booking_id: str, params: dict[str, Any]
    ) -> dict[str, Any] | None:
        return await self._sql.execute(
            ChangeQueryIds.CREATE,
            {"customer_id": customer_id, "booking_id": booking_id,
             "requested_by": params.get("requested_by"),
             "change_type": params.get("change_type"),
             "current_value": params.get("current_value"),
             "proposed_value": params.get("proposed_value"),
             "reason": params.get("reason")},
            fetch="one",
        )

    async def list_for_booking(
        self, customer_id: str, booking_id: str
    ) -> list[dict[str, Any]]:
        rows = await self._sql.execute(
            ChangeQueryIds.LIST,
            {"customer_id": customer_id, "booking_id": booking_id},
            fetch="all",
        )
        return list(rows or [])

    async def get_owned(
        self, customer_id: str, change_id: str
    ) -> dict[str, Any] | None:
        return await self._sql.execute(
            ChangeQueryIds.GET_OWNED,
            {"customer_id": customer_id, "change_id": change_id},
            fetch="one",
        )

    async def decide(self, change_id: str, *, decision: str) -> dict[str, Any] | None:
        return await self._sql.execute(
            ChangeQueryIds.DECIDE,
            {"change_id": change_id, "decision": decision},
            fetch="one",
        )