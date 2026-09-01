"""FinalPaymentService — Module 26: capture the authorized funds.

Runs the business chain CompletionConfirmed → FinalPricing → PaymentCaptured.
Money only moves through the PaymentGateway port; the booking/invoice never
learns which provider processes the capture.
"""
from __future__ import annotations

import logging
from typing import Any

from app.shared.exceptions.hierarchy import ValidationError

logger = logging.getLogger(__name__)


class FinalPaymentService:
    def __init__(
        self,
        bookings: Any,      # BookingRepository port
        payments: Any,      # PaymentRepository port
        invoices: Any,      # InvoiceRepository port (snapshot)
        gateway: Any,       # PaymentGateway port (capture)
        workflows: Any,     # WorkflowManager (injected)
        notifications: Any | None = None,
    ) -> None:
        self._bookings = bookings
        self._payments = payments
        self._invoices = invoices
        self._gateway = gateway
        self._workflows = workflows
        self._notifications = notifications

    async def capture_final_payment(
        self, customer_id: str, booking_id: str
    ) -> dict[str, Any]:
        booking = await self._bookings.get(customer_id, booking_id)
        if booking["status"] != "CUSTOMER_CONFIRMED":
            raise ValidationError(
                f"Final payment requires CUSTOMER_CONFIRMED "
                f"(current: {booking['status']})"
            )

        auth = await self._payments.get_authorization(customer_id, booking_id)
        if not auth or not auth.get("gateway_ref"):
            raise ValidationError("No live authorization found for capture")

        amount_cents = int(round(float(booking["agreed_amount"]) * 100))
        captured = await self._gateway.capture(str(auth["gateway_ref"]), amount_cents)
        if not captured.get("captured"):
            raise ValidationError(
                f"Capture failed: {captured.get('failure_reason')}"
            )

        await self._payments.mark_captured(
            customer_id, str(auth["payment_id"]), captured.get("capture_ref")
        )

        # Workflow guards + persisted status.
        await self._workflows.transition(
            workflow_id="WF.BOOKING.CUSTOMER.V1",
            from_state="CUSTOMER_CONFIRMED", to_state="PAID",
            context={"booking_number": booking["booking_number"]},
        )
        row = await self._bookings.set_status(
            customer_id, booking_id,
            from_state="CUSTOMER_CONFIRMED", to_state="PAID",
        )
        if not row:
            raise ValidationError("Booking state moved during capture")

        # Invoice family snapshot follows the money.
        try:
            inv = await self._invoices.get_by_booking(customer_id, booking_id)
            if inv and inv.get("status") == "ISSUED":
                await self._invoices.mark_paid(customer_id, str(inv["invoice_id"]))
        except Exception as exc:  # pragmatic: money is safe; invoice is cosmetic
            logger.warning("invoice mark-paid skipped for %s: %s", booking_id, exc)

        # Close the loop: PAID -> CLOSED. Flags warranty_eligible so
        # TR_BOOKING_WARRANTY auto-issues the warranty inside Postgres.
        await self._workflows.transition(
            workflow_id="WF.BOOKING.CUSTOMER.V1",
            from_state="PAID", to_state="CLOSED",
            context={"booking_number": booking["booking_number"]},
        )
        closed = await self._bookings.close(customer_id, booking_id)
        if not closed:
            raise ValidationError("Booking could not be closed from PAID")

        if self._notifications is not None:
            await self._notifications.notify(
                customer_id, ntype="PAYMENT.CAPTURED",
                title="Payment received",
                body=f"{booking['booking_number']} — funds captured.",
                ref_type="BOOKING", ref_id=booking_id,
            )

        logger.info("final payment captured for %s (%s)",
                    booking["booking_number"], captured.get("capture_ref"))
        return await self._bookings.get(customer_id, booking_id)