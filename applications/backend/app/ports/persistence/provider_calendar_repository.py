"""Provider Calendar repository port (Phase 15)."""
from __future__ import annotations

from typing import Any, Protocol


class ProviderCalendarRepository(Protocol):
    """Calendar aggregation over bookings, time-off and working hours."""

    async def range(
        self, provider_id: str, from_date: str, to_date: str
    ) -> list[dict[str, Any]]: ...

    async def day(self, provider_id: str, date: str) -> list[dict[str, Any]]: ...

    async def overlap_check(
        self, provider_id: str, scheduled_date: str, exclude_booking_id: str | None = None
    ) -> list[dict[str, Any]]: ...
