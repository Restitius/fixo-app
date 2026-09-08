"""Provider Calendar — calendar views & overlap prevention (Phase 15)."""
from __future__ import annotations

import logging
from datetime import date, timedelta
from typing import Any

from app.shared.exceptions.hierarchy import ConflictError

logger = logging.getLogger(__name__)


class ProviderCalendarService:
    """Aggregates bookings, blocked periods and unavailability into calendar views."""

    def __init__(self, calendar: Any) -> None:
        self._calendar = calendar

    async def range(
        self, provider_id: str, from_date: str, to_date: str
    ) -> list[dict[str, Any]]:
        """Calendar events in a date range (bookings + blocked periods)."""
        return await self._calendar.range(provider_id, from_date, to_date)

    async def day(self, provider_id: str, date: str) -> list[dict[str, Any]]:
        """Single day view: events + working hours."""
        return await self._calendar.day(provider_id, date)

    async def week(
        self, provider_id: str, date: str
    ) -> dict[str, list[dict[str, Any]]]:
        """Week view: 7 day buckets starting from the week containing `date`."""
        base = date.fromisoformat(date)
        start = base - timedelta(days=base.weekday())  # Monday
        days = []
        for i in range(7):
            day_str = (start + timedelta(days=i)).isoformat()
            events = await self._calendar.day(provider_id, day_str)
            days.append({"date": day_str, "events": events})
        return {"week_start": start.isoformat(), "days": days}

    async def month(
        self, provider_id: str, year: int, month: int
    ) -> list[dict[str, Any]]:
        """Month view: all events in the given month."""
        from_date = date(year, month, 1).isoformat()
        if month == 12:
            to_date = date(year + 1, 1, 1) - timedelta(days=1)
        else:
            to_date = date(year, month + 1, 1) - timedelta(days=1)
        return await self._calendar.range(provider_id, from_date, to_date.isoformat())

    async def agenda(
        self, provider_id: str, from_date: str, limit: int = 20
    ) -> list[dict[str, Any]]:
        """Agenda view: upcoming events in chronological order."""
        events = await self._calendar.range(
            provider_id, from_date, date.today().isoformat()
        )
        # For agenda, fetch a wider range and sort
        future = [e for e in events if e.get("start_at") >= from_date]
        return future[:limit]

    async def check_overlap(
        self,
        provider_id: str,
        scheduled_date: str,
        exclude_booking_id: str | None = None,
    ) -> None:
        """Raise ConflictError if the provider already has a booking on this date."""
        overlaps = await self._calendar.overlap_check(
            provider_id, scheduled_date, exclude_booking_id
        )
        if overlaps:
            raise ConflictError(
                "Provider already has a booking on this date",
                details={"overlapping_bookings": overlaps},
            )
