"""ProviderServiceAreaRepository port — service areas + travel policy (Provider Req Phase 8).

The domain owns the validation rules; the adapter is the only code that knows
the PRV.AREAS.* query ids. Three persisted concepts: a 1:1 travel-settings
row, the provider's area entries (LOCATION or RADIUS) and its exclusions.
"""
from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Any


class ProviderServiceAreaRepository(ABC):
    """Persistence boundary for provider service-area configuration."""

    @abstractmethod
    async def get_settings(self, provider_id: str) -> Any | None:
        """The provider's travel policy row, or None when not configured."""

    @abstractmethod
    async def upsert_settings(self, provider_id: str, data: dict[str, Any]) -> Any | None:
        """Create or replace the travel/area policy; returns the stored row."""

    @abstractmethod
    async def list_areas(self, provider_id: str) -> list[dict[str, Any]]:
        """All service-area entries of the provider."""

    @abstractmethod
    async def add_area(self, provider_id: str, data: dict[str, Any]) -> Any | None:
        """Insert one area entry (LOCATION or RADIUS); returns the row."""

    @abstractmethod
    async def update_area(
        self, provider_id: str, area_id: str, data: dict[str, Any]
    ) -> Any | None:
        """Partial edit of one owned area entry; None when not found."""

    @abstractmethod
    async def remove_area(self, provider_id: str, area_id: str) -> Any | None:
        """Delete one owned area entry; returns the removed id, or None."""

    @abstractmethod
    async def list_exclusions(self, provider_id: str) -> list[dict[str, Any]]:
        """Areas the provider explicitly does not serve."""

    @abstractmethod
    async def add_exclusion(self, provider_id: str, data: dict[str, Any]) -> Any | None:
        """Insert one excluded area; returns the row."""

    @abstractmethod
    async def remove_exclusion(
        self, provider_id: str, exclusion_id: str
    ) -> Any | None:
        """Delete one owned exclusion; returns the removed id, or None."""