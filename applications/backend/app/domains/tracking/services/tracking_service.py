"""TrackingService — Modules 21 & 22: location stream + arrival verification.

Provider-side events arrive through the internal integration channel
(TrackingManager role); the customer reads tracking state and verifies
arrival with the 6-digit code from their booking.
"""
from __future__ import annotations

import logging
from typing import Any

from app.shared.exceptions.hierarchy import NotFoundError, ValidationError

logger = logging.getLogger(__name__)


class TrackingService:
    def __init__(
        self,
        tracking: Any,      # TrackingSqlAdapter-style port
        bookings: Any,      # BookingRepository port
        requests: Any,      # mirror status onto request machine? not needed here
        workflows: Any,     # WorkflowManager (injected)
        notifications: Any | None = None,
    ) -> None:
        self._tracking = tracking
        self._bookings = bookings
        self._requests = requests
        self._workflows = workflows
        self._notifications = notifications

    # -- Module 21: provider tracking ---------------------------------------------

    async def record_ping(self, booking_id: str, lat: float, lng: float) -> dict[str, Any]:
        row = await self._tracking.record_ping(booking_id, lat, lng)
        if not row:
            raise ValidationError("Could not record the position ping")
        return {"recorded_at": row["recorded_at"], "latitude": lat, "longitude": lng}

    async def latest_position(self, customer_id: str, booking_id: str) -> dict[str, Any]:
        booking = await self._bookings.get(customer_id, booking_id)
        latest = await self._tracking.latest(booking_id, customer_id)
        if not latest:
            return {
                "booking_status": booking["status"],
                "on_the_way": booking["status"] == "ON_THE_WAY",
                "latest_position": None,
            }
        return {
            "booking_status": booking["status"],
            "on_the_way": booking["status"] == "ON_THE_WAY",
            "latest_position": latest,
        }

    # -- internal provider transitions (drives workflow + timeline + notify) ------

    async def apply_provider_event(
        self, booking_id: str, event: str,
        *, latitude: float | None = None, longitude: float | None = None,
    ) -> dict[str, Any]:
        """Internal channel: ON_THE_WAY / ARRIVED with optional position ping."""
        booking = await self._bookings.get_internal(booking_id)
        if booking is None:
            raise NotFoundError("Booking not found")

        current = booking["status"]
        target = event.upper()
        await self._workflows.transition(
            workflow_id="WF.BOOKING.CUSTOMER.V1",
            from_state=current, to_state=target,
            context={"booking_number": booking["booking_number"]},
        )

        if target == "ARRIVED":
            row = await self._bookings.set_arrived(booking_id)
            if not row:
                raise ValidationError(f"Cannot mark ARRIVED from '{current}'")
        elif target == "STARTED":
            row = await self._bookings.mark_started(booking_id)
            if not row:
                raise ValidationError(f"Cannot mark STARTED from '{current}'")
        else:
            row = await self._bookings.set_status_internal(
                booking_id, customer_id=str(booking["customer_id"]),
                from_state=current, to_state=target,
            )
            if not row:
                raise ValidationError(f"Transition {current} → {target} failed")

        if latitude is not None and longitude is not None:
            await self._tracking.record_ping(booking_id, latitude, longitude)

        await self._bookings.add_timeline_internal(
            booking_id, str(booking["customer_id"]), target, "Provider event"
        )
        # The governed transition query queued its customer message atomically.

        logger.info("provider event %s applied to %s", target, booking_id)
        return await self._bookings.get_internal(booking_id)

    # -- Module 22: arrival verification -------------------------------------------

    async def verify_arrival(
        self, customer_id: str, booking_id: str, code: str
    ) -> dict[str, Any]:
        clean = str(code or "").strip()
        if len(clean) != 6 or not clean.isdigit():
            raise ValidationError("Arrival code must be 6 digits")

        row = await self._bookings.verify_arrival(customer_id, booking_id, clean)
        if not row:
            raise ValidationError(
                "Invalid arrival code, or the provider has not been marked as arrived"
            )
        await self._bookings.add_timeline(
            customer_id, booking_id, "ARRIVAL_VERIFIED", "Customer confirmed arrival"
        )
        return await self._bookings.get(customer_id, booking_id)
