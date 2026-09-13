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
        """Acknowledge a booking (provider confirms receipt).

        ack.sql itself enforces ownership and that the booking is still
        CONFIRMED (via a WHERE EXISTS guard) — a `None` result here means
        one of those didn't hold, not just "not found", but a 404 is the
        honest response either way (it never reveals whether the id exists
        under another provider).
        """
        row = await self._bookings.ack(provider_id=provider_id, booking_id=booking_id)
        if not row:
            raise NotFoundError(f"Booking {booking_id} not found, not yours, or not CONFIRMED")
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

    async def details(self, provider_id: str, booking_id: str) -> dict[str, Any]:
        """Full operational screen for a provider booking (customer, service, schedule, price, etc.)."""
        row = await self._bookings.details(provider_id=provider_id, booking_id=booking_id)
        if not row:
            raise NotFoundError(f"Booking {booking_id} not found")
        return row

    async def timeline(self, provider_id: str, booking_id: str) -> list[dict[str, Any]]:
        """Chronological trail of a provider booking."""
        return await self._bookings.timeline(provider_id=provider_id, booking_id=booking_id)

    async def message_count(self, provider_id: str, booking_id: str) -> dict[str, Any]:
        """Unread/total messages for a booking."""
        row = await self._bookings.message_count(provider_id=provider_id, booking_id=booking_id)
        if not row:
            raise NotFoundError(f"Booking {booking_id} not found")
        return row

    async def start_service(
        self,
        provider_id: str,
        booking_id: str,
        gps_lat: float | None = None,
        gps_lng: float | None = None,
    ) -> dict[str, Any]:
        """Start the service — records actual start time, begins hourly timer (Phase 20)."""
        row = await self._bookings.start_status(provider_id=provider_id, booking_id=booking_id)
        if not row:
            raise NotFoundError(f"Booking {booking_id} not found")
        if row.get("status") == "IN_PROGRESS":
            return row
        if row.get("status") != "ARRIVED":
            raise AuthorizationError(
                f"Cannot start service in status {row.get('status')} — arrive first"
            )
        row = await self._bookings.start_service(
            provider_id=provider_id,
            booking_id=booking_id,
            gps_lat=gps_lat,
            gps_lng=gps_lng,
        )
        if not row:
            raise NotFoundError(f"Booking {booking_id} not found")
        if self._events:
            await self._events.publish(
                "provider.booking.started",
                {"booking_id": booking_id, "provider_id": provider_id},
            )
        return row

    async def start_status(self, provider_id: str, booking_id: str) -> dict[str, Any]:
        """Start-service state for a booking (Phase 20)."""
        row = await self._bookings.start_status(provider_id=provider_id, booking_id=booking_id)
        if not row:
            raise NotFoundError(f"Booking {booking_id} not found")
        return row
