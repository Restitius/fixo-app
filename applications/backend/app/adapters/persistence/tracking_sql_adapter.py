"""TrackingSqlAdapter — provider position pings + latest-known read."""
from __future__ import annotations

from typing import Any

from app.platform.query.sql_query_manager import SQLQueryManager


class TrackingQueryIds:
    SET_LOCATION = "CUS.TRACKING.SET_LOCATION"
    LATEST = "CUS.TRACKING.LATEST"


class TrackingSqlAdapter:
    def __init__(self, sql_manager: SQLQueryManager) -> None:
        self._sql = sql_manager

    async def record_ping(self, booking_id: str, lat: float, lng: float) -> dict[str, Any] | None:
        return await self._sql.execute(
            TrackingQueryIds.SET_LOCATION,
            {"booking_id": booking_id, "latitude": lat, "longitude": lng},
            fetch="one",
        )

    async def latest(self, booking_id: str, customer_id: str) -> dict[str, Any] | None:
        return await self._sql.execute(
            TrackingQueryIds.LATEST,
            {"booking_id": booking_id, "customer_id": customer_id},
            fetch="one",
        )