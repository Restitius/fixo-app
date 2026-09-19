"""BookingService — Modules 16 & 17: confirmation + payment authorization.

Owns WF.BOOKING.CUSTOMER.V1:

    CONFIRMED → PAYMENT_AUTHORIZED | PAYMENT_FAILED | CANCELLED
    PAYMENT_FAILED → CONFIRMED (retry) | CANCELLED

Money movement happens ONLY through PaymentGateway (port); the booking never
learns which provider charged the card. Depends ONLY on ports + managers.
"""
from __future__ import annotations

import logging
from typing import Any

from app.shared.exceptions.hierarchy import NotFoundError, ValidationError

logger = logging.getLogger(__name__)

WORKFLOW = "WF.BOOKING.CUSTOMER.V1"


class BookingService:
    def __init__(
        self,
        bookings: Any,      # BookingRepository port
        payments: Any,      # PaymentRepository port
        quotations: Any,    # QuotationRepository port (accept-state checks)
        requests: Any,      # ServiceRequestRepository port (mirror status)
        gateway: Any,       # PaymentGateway port
        workflows: Any,     # WorkflowManager (injected)
        notifications: Any | None = None,
    ) -> None:
        self._bookings = bookings
        self._payments = payments
        self._quotations = quotations
        self._requests = requests
        self._gateway = gateway
        self._workflows = workflows
        self._notifications = notifications

    # -- Module 16: confirmation ------------------------------------------------

    async def confirm_from_quote(self, customer_id: str, quote_id: str) -> dict[str, Any]:
        """QUOTE_ACCEPTED request + ACCEPTED quote → CONFIRMED booking."""
        quote = await self._quotations.get_owned(customer_id, quote_id)
        if not quote or quote["status"] != "ACCEPTED":
            raise ValidationError("Only an ACCEPTED quote can be booked")

        request = await self._requests.get(customer_id, str(quote["request_id"]))
        if not request:
            raise NotFoundError("Service request not found")
        if request["status"] != "QUOTE_ACCEPTED":
            raise ValidationError(
                f"Request must be QUOTE_ACCEPTED to book (current: {request['status']})"
            )

        row = await self._bookings.create(customer_id, quote_id)
        if not row:
            raise ValidationError("Could not create the booking")

        # Mirror the confirmation on the request machine.
        await self._workflows.transition(
            workflow_id="WF.SERVICE_REQUEST.V1",
            from_state="QUOTE_ACCEPTED", to_state="CONFIRMED",
            context={"booking_number": row["booking_number"]},
        )
        await self._requests.set_status(
            customer_id, str(request["request_id"]),
            from_state="QUOTE_ACCEPTED", to_state="CONFIRMED",
        )

        await self._timeline(customer_id, row["booking_id"],
                             "CREATED", f"Booking {row['booking_number']} confirmed")
        # NTF.BOOKING.CONFIRMED.V1 outbox rows (customer + assigned provider)
        # are queued atomically inside CUS.BOOKING.CREATE itself.
        logger.info("booking %s confirmed for customer %s",
                    row["booking_number"], customer_id)
        return await self.get(customer_id, str(row["booking_id"]))

    # -- queries ------------------------------------------------------------------

    async def get(self, customer_id: str, booking_id: str) -> dict[str, Any]:
        row = await self._bookings.get(customer_id, booking_id)
        if not row:
            raise NotFoundError("Booking not found")
        return row

    async def list(self, customer_id: str, *, status: str | None = None,
                   limit: int = 20, offset: int = 0) -> list[dict[str, Any]]:
        return await self._bookings.list(customer_id, status=status,
                                         limit=limit, offset=offset)

    async def timeline(self, customer_id: str, booking_id: str) -> list[dict[str, Any]]:
        await self.get(customer_id, booking_id)
        return await self._bookings.timeline(customer_id, booking_id)

    async def _timeline(self, customer_id: str, booking_id: str,
                        event: str, detail: str | None) -> None:
        await self._bookings.add_timeline(customer_id, booking_id, event, detail)

    # -- Module 17: initial payment authorization --------------------------------

    async def authorize_payment(self, customer_id: str, booking_id: str) -> dict[str, Any]:
        booking = await self.get(customer_id, booking_id)
        if booking["status"] not in ("CONFIRMED", "PAYMENT_FAILED"):
            raise ValidationError(
                f"Payment can only be authorized from CONFIRMED/PAYMENT_FAILED "
                f"(current: {booking['status']})"
            )

        attempt = await self._payments.create_attempt(
            customer_id, booking_id, getattr(self._gateway, "gateway_name", "MOCK")
        )
        if not attempt:
            raise ValidationError("Could not open the payment attempt")

        amount_cents = int(round(float(booking["agreed_amount"]) * 100))
        result = await self._gateway.authorize(
            str(attempt["payment_id"]), amount_cents, booking["currency"]
        )

        ok_auth = bool(result.get("authorized"))
        await self._payments.set_result(
            customer_id, booking_id, str(attempt["payment_id"]),
            result="AUTHORIZED" if ok_auth else "FAILED",
            gateway_ref=result.get("gateway_ref"),
            failure_reason=result.get("failure_reason"),
        )

        target = "PAYMENT_AUTHORIZED" if ok_auth else "PAYMENT_FAILED"
        await self._workflows.transition(
            workflow_id=WORKFLOW,
            from_state=booking["status"], to_state=target,
            context={"attempt_no": attempt["attempt_no"]},
        )
        row = await self._bookings.set_status(
            customer_id, booking_id,
            from_state=booking["status"], to_state=target,
        )
        if not row:
            raise ValidationError("Booking state moved during authorization")

        await self._timeline(
            customer_id, booking_id, target,
            f"Attempt #{attempt['attempt_no']} via {result.get('gateway')}"
            + (f" ref={result['gateway_ref']}" if ok_auth
               else f" — {result.get('failure_reason')}"),
        )

        updated = await self.get(customer_id, booking_id)
        # CUS.BOOKING.SET_STATUS is shared across many transitions, so it
        # can't safely carry a notification-specific CTE — queued here
        # instead, right after the state write.
        if ok_auth and self._notifications is not None:
            await self._notifications.queue_notification(
                "customer", customer_id,
                key="NTF.PAYMENT.AUTHORIZED.V1",
                data={"booking_id": booking_id, "booking_number": booking["booking_number"]},
            )
        return {
            **updated,
            "payment": {
                "payment_id": str(attempt["payment_id"]),
                "attempt_no": attempt["attempt_no"],
                "status": "AUTHORIZED" if ok_auth else "FAILED",
                "gateway_ref": result.get("gateway_ref"),
                "failure_reason": result.get("failure_reason"),
            },
        }

    async def cancel(self, customer_id: str, booking_id: str) -> dict[str, Any]:
        booking = await self.get(customer_id, booking_id)
        if self._workflows.is_terminal(WORKFLOW, booking["status"]):
            raise ValidationError(
                f"Bookings in status '{booking['status']}' cannot be cancelled"
            )
        await self._workflows.transition(
            workflow_id=WORKFLOW,
            from_state=booking["status"], to_state="CANCELLED",
            context={"booking_number": booking["booking_number"]},
        )
        await self._bookings.set_status(
            customer_id, booking_id,
            from_state=booking["status"], to_state="CANCELLED",
        )
        await self._timeline(customer_id, booking_id, "CANCELLED", None)
        return await self.get(customer_id, booking_id)