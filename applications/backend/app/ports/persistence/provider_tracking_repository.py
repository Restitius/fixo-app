"""ProviderTrackingRepository — port for provider trip tracking (Phase 18)."""
from __future__ import annotations

from typing import Any, Protocol


class ProviderTrackingRepository(Protocol):
    """Provider-side trip tracking: start/end trip, stream location, read nav info."""

    async def start_trip(self, provider_id: str, booking_id: str) -> dict[str, Any] | None:
        """Begin travel: set status=ON_THE_WAY, stamp trip_started_at."""
        ...

    async def update_location(
        self, provider_id: str, booking_id: str, latitude: float, longitude: float, eta_minutes: int | None
    ) -> dict[str, Any] | None:
        """Stream GPS position + ETA (live snapshot on BOOKINGS)."""
        ...

    async def record_location(
        self, booking_id: str, latitude: float, longitude: float
    ) -> dict[str, Any] | None:
        """Append GPS trace to PROVIDER_LOCATIONS history."""
        ...

    async def end_trip(self, provider_id: str, booking_id: str) -> dict[str, Any] | None:
        """Stop sharing location: stamp trip_ended_at."""
        ...

    async def get_location(self, booking_id: str) -> dict[str, Any] | None:
        """Customer views provider's live position (status must be ON_THE_WAY)."""
        ...

    async def get_nav_info(self, provider_id: str, booking_id: str) -> dict[str, Any] | None:
        """Provider views customer address + trip context for navigation."""
        ...
