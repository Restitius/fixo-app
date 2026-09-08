"""ProviderAvailabilityRepository port — working hours & availability (Provider Req Phase 9).

The domain owns the schedule rules; the adapter is the only code that knows
the PRV.AVAIL.* query ids. Three persisted concepts: a 1:1 settings row
(online toggle + emergency/same-day/holiday + vacation), the weekly
recurring windows and temporary unavailable periods.
"""
from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Any


class ProviderAvailabilityRepository(ABC):
    """Persistence boundary for provider availability configuration."""

    @abstractmethod
    async def get_settings(self, provider_id: str) -> Any | None:
        """The provider's availability settings row, or None."""

    @abstractmethod
    async def upsert_settings(self, provider_id: str, data: dict[str, Any]) -> Any | None:
        """Create or replace the availability toggles; returns the stored row."""

    @abstractmethod
    async def list_hours(self, provider_id: str) -> list[dict[str, Any]]:
        """The weekly recurring schedule rows."""

    @abstractmethod
    async def set_day(
        self, provider_id: str, day_of_week: int, data: dict[str, Any]
    ) -> Any | None:
        """Upsert one day's working window; returns the stored row."""

    @abstractmethod
    async def clear_day(self, provider_id: str, day_of_week: int) -> Any | None:
        """Reset one day (no row = unset/unavailable); returns the removed day."""

    @abstractmethod
    async def list_time_off(self, provider_id: str) -> list[dict[str, Any]]:
        """Temporary unavailable periods."""

    @abstractmethod
    async def add_time_off(self, provider_id: str, data: dict[str, Any]) -> Any | None:
        """Insert one unavailable period; returns the row."""

    @abstractmethod
    async def remove_time_off(self, provider_id: str, time_off_id: str) -> Any | None:
        """Delete one owned unavailable period; returns the removed id, or None."""

    @abstractmethod
    async def summary(self, provider_id: str) -> Any | None:
        """Effective availability snapshot (settings + schedule + active time-off)."""