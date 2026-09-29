"""BookingService — Modules 16 & 17: confirmation + payment authorization.

Owns WF.BOOKING.CUSTOMER.V1:

    CONFIRMED → PAYMENT_AUTHORIZED | PAYMENT_FAILED | CANCELLED
    PAYMENT_FAILED → CONFIRMED (retry) | CANCELLED

Money movement happens ONLY through PaymentGateway (port); the booking never
learns which provider charged the card. Depends ONLY on ports + managers.
"""
from __future__ import annotations

import logging
from datetime import date, timedelta
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
        settlement: Any | None = None,   # PaymentSettlementService
        promotions: Any | None = None,   # PromotionService — resolves a promo code at checkout
    ) -> None:
        self._settlement = settlement
        self._bookings = bookings
        self._payments = payments
        self._quotations = quotations
        self._requests = requests
        self._gateway = gateway
        self._workflows = workflows
        self._notifications = notifications
        self._promotions = promotions

    # -- Module 16: confirmation ------------------------------------------------

    async def confirm_from_quote(
        self, customer_id: str, quote_id: str, promo_code: str | None = None,
    ) -> dict[str, Any]:
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

        promo_id = None
        discount_amount = 0.0
        code = (promo_code or "").strip().upper()
        if code:
            if self._promotions is None:
                raise ValidationError("Promotion code is not valid or has expired")
            try:
                promo = await self._promotions.validate(code, float(quote["amount"]), customer_id)
            except ValueError as exc:
                raise ValidationError(str(exc)) from None
            promo_id = str(promo["promo_id"])
            discount_amount = float(promo["discount_amount"])

        row = await self._bookings.create(customer_id, quote_id, promo_id, code or None, discount_amount)
        if not row:
            # Either the quote/request guard failed, or (rarely) a concurrent booking
            # just used the same code — the SQL guard refuses both the same way.
            raise ValidationError(
                "This promotion was just used up. Try booking again without a code."
                if promo_id else "Could not create the booking"
            )

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

        detail = f"Booking {row['booking_number']} confirmed"
        if discount_amount:
            detail += f" — promo {code} saved {discount_amount:g} {row.get('currency', '')}".rstrip()
        await self._timeline(customer_id, row["booking_id"], "CREATED", detail)
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

    async def authorize_payment(
        self, customer_id: str, booking_id: str, payment_method: str | None = None
    ) -> dict[str, Any]:
        booking = await self.get(customer_id, booking_id)
        if booking["status"] not in ("CONFIRMED", "PAYMENT_FAILED"):
            raise ValidationError(
                f"Payment can only be authorized from CONFIRMED/PAYMENT_FAILED "
                f"(current: {booking['status']})"
            )

        gateway_name = (
            "WALLET" if str(payment_method or "").upper() == "WALLET"
            else getattr(self._gateway, "gateway_name", "MOCK")
        )
        attempt = await self._payments.create_attempt(customer_id, booking_id, gateway_name)
        if not attempt:
            raise ValidationError("Could not open the payment attempt")

        amount_cents = int(round(float(booking["agreed_amount"]) * 100))
        result = await self._gateway.authorize(
            str(attempt["payment_id"]), amount_cents, booking["currency"],
            method=payment_method, customer_id=customer_id, booking_id=booking_id,
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

        # The governed status query queued the payment result atomically.
        updated = await self.get(customer_id, booking_id)
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

    MAX_RESCHEDULES = 2
    RESCHEDULE_WINDOWS = ("MORNING", "AFTERNOON", "EVENING")
    RESCHEDULE_HORIZON_DAYS = 90
    RESCHEDULABLE = ("CONFIRMED", "PAYMENT_AUTHORIZED")

    async def reschedule(
        self, customer_id: str, booking_id: str, scheduled_date: str, time_window: str,
        reason: str | None = None,
    ) -> dict[str, Any]:
        """Move a booking that has not started to another day / time window."""
        try:
            new_date = date.fromisoformat(scheduled_date)
        except (TypeError, ValueError):
            raise ValidationError("Choose a valid date (YYYY-MM-DD)") from None
        window = (time_window or "").upper()
        if window not in self.RESCHEDULE_WINDOWS:
            raise ValidationError("Time window must be MORNING, AFTERNOON or EVENING")
        today = date.today()
        if new_date <= today:
            raise ValidationError("Choose a date after today")
        if new_date > today + timedelta(days=self.RESCHEDULE_HORIZON_DAYS):
            raise ValidationError(
                f"Bookings can only be moved up to {self.RESCHEDULE_HORIZON_DAYS} days ahead"
            )

        booking = await self.get(customer_id, booking_id)
        if booking["status"] not in self.RESCHEDULABLE:
            raise ValidationError("This booking has started or finished and can no longer be rescheduled")
        if int(booking.get("reschedule_count") or 0) >= self.MAX_RESCHEDULES:
            raise ValidationError(
                f"A booking can be rescheduled at most {self.MAX_RESCHEDULES} times"
            )
        current = booking.get("scheduled_date")
        if str(current)[:10] == new_date.isoformat() and (booking.get("time_window") or "").upper() == window:
            raise ValidationError("The booking is already scheduled for that day and time")

        detail = f"Moved to {new_date.isoformat()} ({window})"
        if reason and reason.strip():
            detail += f": {reason.strip()[:300]}"
        moved = await self._bookings.reschedule(
            customer_id, booking_id, new_date, window, self.MAX_RESCHEDULES, detail
        )
        if moved is None:
            # Lost a race with another change (status moved on, or the limit was just used).
            raise ValidationError("This booking can no longer be rescheduled")
        return await self.get(customer_id, booking_id)

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
        if self._settlement is not None:
            # No cancellation fee on this path: hand back everything that was held.
            await self._settlement.release(
                customer_id, booking_id, float(booking.get("agreed_amount") or 0),
                "Refund for a cancelled booking",
            )
        return await self.get(customer_id, booking_id)
