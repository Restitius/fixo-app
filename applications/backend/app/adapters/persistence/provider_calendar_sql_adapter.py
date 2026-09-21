"""Provider Calendar SQL adapter (Phase 15)."""
from __future__ import annotations

import json
import logging
from datetime import date, datetime
from typing import Any

from app.platform.query.sql_query_manager import SQLQueryManager

logger = logging.getLogger(__name__)

# Query IDs (registered in registry.yaml)
_RANGE = "PROV.CALENDAR.RANGE"
_DAY = "PROV.CALENDAR.DAY"
_OVERLAP = "PROV.CALENDAR.OVERLAP_CHECK"


class ProviderCalendarSqlAdapter:
    """Calendar aggregation over bookings, time-off and working hours."""

    def __init__(self, sql: SQLQueryManager) -> None:
        self._sql = sql

    async def range(
        self, provider_id: str, from_date: str | date, to_date: str | date
    ) -> list[dict[str, Any]]:
        rows = await self._sql.execute(
            _RANGE,
            {"user_id": provider_id, "from_date": _to_date(from_date), "to_date": _to_date(to_date)},
            fetch="all",
        ) or []
        return [_parse_event(r) for r in rows]

    async def day(self, provider_id: str, date: str | date) -> list[dict[str, Any]]:
        rows = await self._sql.execute(
            _DAY, {"user_id": provider_id, "date": _to_date(date)}, fetch="all"
        ) or []
        return [_parse_event(r) for r in rows]

    async def overlap_check(
        self, provider_id: str, scheduled_date: str | date, exclude_booking_id: str | None = None
    ) -> list[dict[str, Any]]:
        rows = await self._sql.execute(
            _OVERLAP,
            {
                "user_id": provider_id,
                "scheduled_date": _to_date(scheduled_date),
                "exclude_booking_id": exclude_booking_id,
            },
            fetch="all",
        ) or []
        return [dict(r) for r in rows]


def _to_date(value: str | date) -> date:
    """Convert a string to date if needed (SQL expects date objects for CAST AS date)."""
    if isinstance(value, date):
        return value
    return datetime.strptime(value, "%Y-%m-%d").date()


def _parse_event(row: dict[str, Any]) -> dict[str, Any]:
    """Parse a calendar event row, normalising the JSON details field."""
    event = dict(row)
    details = event.get("details")
    if isinstance(details, str):
        try:
            event["details"] = json.loads(details)
        except (ValueError, TypeError):
            event["details"] = {}
    elif details is None:
        event["details"] = {}
    return event
