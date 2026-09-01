"""Recurring SQL adapter - the ONLY place CUS.RECURRING.* IDs appear."""
from __future__ import annotations
from typing import Any

from app.platform.query.sql_query_manager import SQLQueryManager
from app.ports.persistence.recurring_repository import RecurringRepositoryPort


class RecurringSqlAdapter(RecurringRepositoryPort):
    def __init__(self, sql_manager: SQLQueryManager) -> None:
        self._sql = sql_manager

    async def create(self, customer_id: str, data: dict[str, Any]) -> dict[str, Any]:
        row = await self._sql.execute(
            "CUS.RECURRING.CREATE",
            {"customer_id": customer_id, **data}, fetch="one",
        )
        return dict(row) if row else {}

    async def list(self, customer_id: str, page: int, limit: int) -> list[dict[str, Any]]:
        rows = await self._sql.execute(
            "CUS.RECURRING.LIST",
            {"customer_id": customer_id,
             "offset": (page - 1) * limit, "limit": limit},
            fetch="all",
        )
        return list(rows or [])

    async def get(self, customer_id: str, recurring_id: str) -> dict[str, Any] | None:
        row = await self._sql.execute(
            "CUS.RECURRING.GET",
            {"customer_id": customer_id, "recurring_id": recurring_id}, fetch="one",
        )
        return dict(row) if row else None

    async def set_status(self, customer_id: str, recurring_id: str,
                         from_state: str, to_state: str) -> dict[str, Any] | None:
        row = await self._sql.execute(
            "CUS.RECURRING.SET_STATUS",
            {"customer_id": customer_id, "recurring_id": recurring_id,
             "from_state": from_state, "to_state": to_state},
            fetch="one",
        )
        return dict(row) if row else None

    async def due(self, limit: int = 100) -> list[dict[str, Any]]:
        rows = await self._sql.execute(
            "CUS.RECURRING.DUE", {"limit": limit}, fetch="all",
        )
        return list(rows or [])

    async def generate_request(self, recurring_id: str) -> dict[str, Any] | None:
        row = await self._sql.execute(
            "CUS.RECURRING.GENERATE_REQUEST",
            {"recurring_id": recurring_id}, fetch="one",
        )
        return dict(row) if row else None
