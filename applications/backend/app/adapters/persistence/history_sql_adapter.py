"""History adapter — the ONLY place CUS.HISTORY.* / CUS.ACTIVITY.* IDs appear."""
from __future__ import annotations

from typing import Any

from app.platform.query.sql_query_manager import SQLQueryManager
from app.ports.persistence.history_repository import HistoryRepositoryPort


class HistorySqlAdapter(HistoryRepositoryPort):
    def __init__(self, queries: SQLQueryManager) -> None:
        self._q = queries

    async def list_bookings(self, customer_id: str, status: str | None, limit: int, offset: int) -> list[dict[str, Any]]:
        return await self._q.execute("CUS.HISTORY.BOOKINGS", {
            "user_id": customer_id, "status": status,
            "limit": min(max(limit, 1), 100), "offset": max(offset, 0),
        })

    async def booking_timeline(self, customer_id: str, booking_id: str) -> list[dict[str, Any]]:
        return await self._q.execute("CUS.HISTORY.BOOKING_TIMELINE", {
            "user_id": customer_id, "booking_id": booking_id,
        })

    async def list_activity(self, customer_id: str, event: str | None, limit: int, offset: int) -> list[dict[str, Any]]:
        return await self._q.execute("CUS.ACTIVITY.LIST", {
            "user_id": customer_id, "event": event,
            "limit": min(max(limit, 1), 100), "offset": max(offset, 0),
        })