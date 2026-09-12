"""ChangeRequestService — Module 24: propose + approve/decline changes.

Party rule: the side that did NOT propose decides. Customer-side API proposes
as CUSTOMER and can decide PROVIDER proposals (provider proposals arrive via
the internal channel). Applies approved effects to the booking aggregate.
"""
from __future__ import annotations

import logging
from datetime import date
from typing import Any

from app.shared.exceptions.hierarchy import NotFoundError, ValidationError

logger = logging.getLogger(__name__)

CHANGE_TYPES = ("SCOPE", "TIME", "PRICE")
ACTIVE_STATUSES = {"ARRIVED", "STARTED", "IN_PROGRESS", "COMPLETION_REQUESTED"}


class ChangeRequestService:
    def __init__(
        self,
        changes: Any,       # ChangeRequestRepository port
        bookings: Any,      # BookingRepository port
        workflows: Any,     # WorkflowManager (injected)
        notifications: Any | None = None,
    ) -> None:
        self._changes = changes
        self._bookings = bookings
        self._workflows = workflows
        self._notifications = notifications

    async def propose(
        self, customer_id: str, booking_id: str, data: dict[str, Any]
    ) -> dict[str, Any]:
        change_type = str(data.get("change_type") or "").upper()
        if change_type not in CHANGE_TYPES:
            raise ValidationError(
                f"change_type must be one of: {', '.join(CHANGE_TYPES)}"
            )
        proposed = str(data.get("proposed_value") or "").strip()
        if not proposed:
            raise ValidationError("proposed_value is required")

        booking = await self._bookings.get(customer_id, booking_id)
        if not booking:
            raise NotFoundError("Booking not found")
        if booking["status"] not in ACTIVE_STATUSES:
            raise ValidationError(
                f"Changes can only be proposed while work is active "
                f"(current: {booking['status']})"
            )

        current = {
            "TIME": str(booking.get("scheduled_date") or ""),
            "PRICE": f"{booking['agreed_amount']} {booking['currency']}",
            "SCOPE": str(booking.get("scope_notes") or "Original agreed scope"),
        }[change_type]

        row = await self._changes.create(customer_id, booking_id, {
            "requested_by": "CUSTOMER",
            "change_type": change_type,
            "current_value": current,
            "proposed_value": proposed,
            "reason": data.get("reason"),
        })
        if not row:
            raise ValidationError("Could not submit the change request")

        await self._bookings.add_timeline(
            customer_id, booking_id, "CHANGE_PROPOSED",
            f"{change_type}: {proposed}",
        )
        return await self._changes.get_owned(customer_id, str(row["change_id"]))

    async def list_for_booking(
        self, customer_id: str, booking_id: str
    ) -> list[dict[str, Any]]:
        booking = await self._bookings.get(customer_id, booking_id)
        if not booking:
            raise NotFoundError("Booking not found")
        return await self._changes.list_for_booking(customer_id, booking_id)

    async def decide(
        self, customer_id: str, change_id: str, *, decision: str
    ) -> dict[str, Any]:
        decision = decision.upper()
        if decision not in ("APPROVED", "DECLINED"):
            raise ValidationError("decision must be APPROVED or DECLINED")

        change = await self._changes.get_owned(customer_id, change_id)
        if not change:
            raise NotFoundError("Change request not found")
        if change["requested_by"] != "PROVIDER":
            raise ValidationError(
                "Customer decisions apply to provider-proposed changes"
            )

        # Validate the effect BEFORE any state changes commit. decide() and
        # _apply_effect() are separate, non-transactional writes (each query
        # commits on its own) — validating first means a bad proposed_value
        # 422s here instead of leaving the change permanently stuck APPROVED
        # with its effect never applied.
        if decision == "APPROVED":
            effect = self._validate_effect(change["change_type"], change["proposed_value"])

        wf_decision = await self._workflows.transition(
            workflow_id="WF.CHANGE_REQUEST.V1",
            from_state=change["status"], to_state=decision,
            context={"change_id": change_id},
        )

        row = await self._changes.decide(change_id, decision=decision)
        if not row:
            raise ValidationError("Change request was already decided")

        booking_id = str(row["booking_id"])
        if decision == "APPROVED":
            await self._apply_effect(booking_id, row["change_type"], effect)

        detail = f"{row['change_type']} {decision}: {row['proposed_value']}"
        await self._bookings.add_timeline(customer_id, booking_id,
                                          f"CHANGE_{decision}", detail)
        logger.info("change %s %s", change_id, decision)
        return {**row, "decision": decision}

    @staticmethod
    def _validate_effect(change_type: str, value: str) -> Any:
        """Parse+validate a proposed_value without writing anything."""
        if change_type == "PRICE":
            try:
                return float(value)
            except ValueError as exc:
                raise ValidationError("Approved price is not numeric") from exc
        if change_type == "TIME":
            try:
                return date.fromisoformat(value).isoformat()
            except ValueError as exc:
                raise ValidationError("Approved date must be YYYY-MM-DD") from exc
        # SCOPE: any non-empty text is valid (already enforced at propose time).
        return value

    async def _apply_effect(self, booking_id: str, change_type: str, value: Any) -> None:
        if change_type == "PRICE":
            await self._bookings.update_amount(booking_id, value)
        elif change_type == "TIME":
            await self._bookings.set_scheduled_date(booking_id, value)
        elif change_type == "SCOPE":
            await self._bookings.set_scope_notes(booking_id, value)