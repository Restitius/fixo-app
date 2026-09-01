"""History service — read-only screens fed by dedicated registered reads (Module 40/42)."""
from __future__ import annotations
from typing import Any

from app.ports.persistence.history_repository import HistoryRepositoryPort


class HistoryService:
    def __init__(self, repo: HistoryRepositoryPort) -> None:
        self._repo = repo

    async def bookings(self, customer_id: str, status: str | None = None,
                       limit: int = 20, offset: int = 0) -> list[dict[str, Any]]:
        return await self._repo.list_bookings(customer_id, status, limit, offset)

    async def timeline(self, customer_id: str, booking_id: str) -> list[dict[str, Any]]:
        return await self._repo.booking_timeline(customer_id, booking_id)

    async def activity(self, customer_id: str, event: str | None = None,
                       limit: int = 20, offset: int = 0) -> list[dict[str, Any]]:
        return await self._repo.list_activity(customer_id, event, limit, offset)