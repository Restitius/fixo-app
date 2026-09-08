"""Provider Arrival service (Requirement Phase 19)."""
from __future__ import annotations

import logging
from typing import Any

from app.ports.persistence.provider_arrival_repository import ProviderArrivalRepository
from app.shared.exceptions.hierarchy import NotFoundError, ValidationError

logger = logging.getLogger(__name__)


class ProviderArrivalService:
    """Provider arrival operations — GPS arrival + PIN verification."""

    def __init__(self, arrival: ProviderArrivalRepository) -> None:
        self._arrival = arrival

    async def arrive(
        self, provider_id: str, booking_id: str, latitude: float, longitude: float
    ) -> dict[str, Any]:
        """Record provider arrival with GPS coordinates."""
        if not (-90 <= latitude <= 90):
            raise ValidationError(f"Invalid latitude: {latitude}")
        if not (-180 <= longitude <= 180):
            raise ValidationError(f"Invalid longitude: {longitude}")

        row = await self._arrival.arrive(provider_id, booking_id, latitude, longitude)
        if not row:
            raise NotFoundError(
                "Booking not found, not assigned to you, or not in ON_THE_WAY status"
            )
        return dict(row)

    async def verify_pin(self, provider_id: str, booking_id: str, code: str) -> dict[str, Any]:
        """Verify the customer's job PIN to start work."""
        if not code or len(code) != 6 or not code.isdigit():
            raise ValidationError("PIN must be a 6-digit code")

        row = await self._arrival.verify_pin(provider_id, booking_id, code)
        if not row:
            raise NotFoundError(
                "Booking not found, not assigned to you, not arrived, or PIN incorrect"
            )
        return dict(row)

    async def status(self, provider_id: str, booking_id: str) -> dict[str, Any] | None:
        """Get arrival state for a booking."""
        row = await self._arrival.status(provider_id, booking_id)
        return dict(row) if row else None
