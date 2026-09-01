"""Datetime helpers (pure, UTC-first).

Includes the storage/logs partitioning scheme (§21):
    storage/logs/YYYY/MONTH/DD/application.log  e.g. 2026/AUGUST/24
"""
from __future__ import annotations

from datetime import datetime, timezone

MONTHS = (
    "JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE",
    "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER",
)


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


def iso_utc(dt: datetime | None = None) -> str:
    return (dt or utcnow()).isoformat()


def log_folder_parts(dt: datetime | None = None) -> tuple[str, str, str]:
    """(year, MONTH-NAME, day) triple for the daily log folder layout."""
    value = dt or utcnow()
    return (f"{value.year:04d}", MONTHS[value.month - 1], f"{value.day:02d}")


def month_folder(dt: datetime | None = None) -> str:
    year, month, _ = log_folder_parts(dt)
    return f"{year}/{month}"
