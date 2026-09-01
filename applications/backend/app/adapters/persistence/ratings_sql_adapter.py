"""Ratings adapter — owns CUS.RATING.* query IDs."""
from __future__ import annotations
from typing import Any

from app.platform.query.sql_query_manager import SQLQueryManager
from app.ports.persistence.phase16_ports import RatingRepositoryPort, BookingClosePort


class RatingSqlAdapter(RatingRepositoryPort):
    def __init__(self, queries: SQLQueryManager) -> None:
        self._queries = queries

    async def submit(self, booking_id: str, customer_id: str, rating: int, comment: str | None) -> dict[str, Any] | None:
        rows = await self._queries.execute(
            "CUS.RATING.SUBMIT",
            {"booking_id": booking_id, "user_id": customer_id, "rating": rating, "comment": comment},
        )
        return rows[0] if rows else None

    async def get_for_booking(self, booking_id: str, customer_id: str) -> dict[str, Any] | None:
        rows = await self._queries.execute(
            "CUS.RATING.BOOKING_GET", {"booking_id": booking_id, "user_id": customer_id}
        )
        return rows[0] if rows else None

    async def provider_stars(self, provider_id: str) -> dict[str, Any] | None:
        rows = await self._queries.execute(
            "CUS.RATING.PROVIDER_STARS", {"provider_id": provider_id}
        )
        return rows[0] if rows else None


class BookingCloseSqlAdapter(BookingClosePort):
    def __init__(self, queries: SQLQueryManager) -> None:
        self._queries = queries

    async def close_booking(self, booking_id: str) -> dict[str, Any] | None:
        rows = await self._queries.execute(
            "CUS.BOOKING.CLOSE", {"booking_id": booking_id}
        )
        return rows[0] if rows else None