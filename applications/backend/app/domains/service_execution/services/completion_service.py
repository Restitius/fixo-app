"""CompletionService — Module 25: customer confirms the finished job."""
from __future__ import annotations

import logging
from typing import Any

from app.shared.exceptions.hierarchy import ValidationError

logger = logging.getLogger(__name__)


class CompletionService:
    def __init__(
        self,
        bookings: Any,       # BookingRepository port
        workflows: Any,      # WorkflowManager (injected)
        notifications: Any | None = None,
    ) -> None:
        self._bookings = bookings
        self._workflows = workflows
        self._notifications = notifications

    async def confirm_completion(
        self, customer_id: str, booking_id: str
    ) -> dict[str, Any]:
        booking = await self._bookings.get(customer_id, booking_id)
        if booking["status"] != "COMPLETION_REQUESTED":
            raise ValidationError(
                f"Completion can only be confirmed when the provider has "
                f"requested it (current: {booking['status']})"
            )

        await self._workflows.transition(
            workflow_id="WF.BOOKING.CUSTOMER.V1",
            from_state="COMPLETION_REQUESTED", to_state="CUSTOMER_CONFIRMED",
            context={"booking_number": booking["booking_number"]},
        )
        row = await self._bookings.mark_completed(customer_id, booking_id)
        if not row:
            raise ValidationError("Could not confirm completion")

        await self._bookings.add_timeline(
            customer_id, booking_id,
            "SERVICE_COMPLETED", "Customer confirmed the finished job",
        )
        # NTF.SERVICE.COMPLETED.V1 outbox row is queued atomically inside
        # CUS.BOOKING.MARK_COMPLETED.
        logger.info("completion confirmed for %s", booking["booking_number"])
        return await self._bookings.get(customer_id, booking_id)