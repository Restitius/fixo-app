"""Rebook SQL adapter - translates business operations into governed SQL query IDs."""
from __future__ import annotations
from typing import Any

from app.platform.query.sql_query_manager import SQLQueryManager
from app.ports.persistence.rebook_repository import RebookRepositoryPort


class RebookSqlAdapter(RebookRepositoryPort):
    """The ONLY place where CUS.REBOOK.* IDs appear."""

    def __init__(self, sql_manager: SQLQueryManager) -> None:
        self._sql = sql_manager

    async def preview(self, booking_id: str, customer_id: str) -> dict[str, Any] | None:
        row = await self._sql.execute(
            "CUS.REBOOK.PREVIEW",
            {"booking_id": booking_id, "customer_id": customer_id},
            fetch="one",
        )
        return dict(row) if row else None

    async def create_request(self, booking_id: str, customer_id: str) -> dict[str, Any]:
        row = await self._sql.execute(
            "CUS.REBOOK.CREATE",
            {"booking_id": booking_id, "customer_id": customer_id},
            fetch="one",
        )
        return dict(row) if row else {}

