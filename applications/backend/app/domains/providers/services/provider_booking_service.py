"""Provider Booking Confirmation — provider-side booking views + acknowledgement (Phase 14)."""
from __future__ import annotations

import logging
from typing import Any

from app.shared.exceptions.hierarchy import AuthorizationError, NotFoundError

logger = logging.getLogger(__name__)


class ProviderBookingService:
    """Provider-side booking views + acknowledgement (Requirement Phase 14)."""

    def __init__(self, bookings: Any, events: Any = None) -> None:
        self._bookings = bookings
        self._events = events

    async def feed(
        self,
        provider_id: str,
        status: str | None = None,
        limit: int = 20,
        offset: int = 0,
    ) -> dict[str, Any]:
        """List provider's bookings with optional status filter."""
        return await self._bookings.feed(
            provider_id=provider_id,
            status=status,
            limit=min(limit, 100),
            offset=offset,
        )

    async def get(self, provider_id: str, booking_id: str) -> dict[str, Any]:
        """Get full booking detail for provider (customer, service, address, etc.)."""
        row = await self._bookings.get(provider_id=provider_id, booking_id=booking_id)
        if not row:
            raise NotFoundError(f"Booking {booking_id} not found")
        return row

    async def acknowledge(self, provider_id: str, booking_id: str) -> dict[str, Any]:
        """Acknowledge a booking (provider confirms receipt)."""
        row = await self._bookings.ack(provider_id=provider_id, booking_id=booking_id)
        if not row:
            raise NotFoundError(f"Booking {booking_id} not found")
        if row.get("provider_id") != provider_id:
            raise AuthorizationError("Not your booking")
        if row.get("status") != "CONFIRMED":
            raise AuthorizationError(f"Cannot acknowledge booking in status {row.get('status')}")
        if self._events:
            await self._events.publish(
                "provider.booking.acknowledged",
                {"booking_id": booking_id, "provider_id": provider_id},
            )
        return row

    async def ack_status(self, provider_id: str, booking_id: str) -> dict[str, Any]:
        """Get acknowledgement status for a booking."""
        row = await self._bookings.ack_status(provider_id=provider_id, booking_id=booking_id)
        if not row:
            raise NotFoundError(f"Booking {booking_id} not found")
        return row
