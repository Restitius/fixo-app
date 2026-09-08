"""ProviderBookingSqlAdapter — implements ProviderBookingRepository via governed queries."""
from __future__ import annotations

from typing import Any

from app.platform.query.sql_query_manager import SQLQueryManager


class ProviderBookingQueryIds:
    FEED = "PROV.BOOKING.FEED"
    GET = "PROV.BOOKING.GET"
    ACK = "PROV.BOOKING.ACK"
    ACK_STATUS = "PROV.BOOKING.ACK_STATUS"


class ProviderBookingSqlAdapter:
    def __init__(self, sql_manager: SQLQueryManager) -> None:
        self._sql = sql_manager

    async def feed(
        self,
        provider_id: str,
        *,
        status: str | None = None,
        limit: int = 20,
        offset: int = 0,
    ) -> list[dict[str, Any]]:
        rows = await self._sql.execute(
            ProviderBookingQueryIds.FEED,
            {"user_id": provider_id, "status": status, "limit": limit, "offset": offset},
            fetch="all",
        )
        return list(rows or [])

    async def get(self, provider_id: str, booking_id: str) -> dict[str, Any] | None:
        return await self._sql.execute(
            ProviderBookingQueryIds.GET,
            {"user_id": provider_id, "booking_id": booking_id},
            fetch="one",
        )

    async def ack(
        self, provider_id: str, booking_id: str, notes: str | None = None
    ) -> dict[str, Any] | None:
        return await self._sql.execute(
            ProviderBookingQueryIds.ACK,
            {"user_id": provider_id, "booking_id": booking_id, "notes": notes},
            fetch="one",
        )

    async def ack_status(
        self, provider_id: str, booking_id: str
    ) -> dict[str, Any] | None:
        return await self._sql.execute(
            ProviderBookingQueryIds.ACK_STATUS,
            {"user_id": provider_id, "booking_id": booking_id},
            fetch="one",
        )
