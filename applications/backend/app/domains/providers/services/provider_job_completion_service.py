"""ProviderJobCompletionService — job completion (Requirement Phase 25).

When work is finished the provider selects "Complete Job" and enters
completion notes, work performed, materials used, before/after
evidence, warranty details, recommended follow-up and additional
maintenance recommendations. The customer then receives "Provider has
completed the job" and can confirm completion (Phase 26 — customer
sign-off via the Module 25 flow).
"""
from __future__ import annotations

from typing import Any

from app.shared.exceptions.hierarchy import AuthorizationError, NotFoundError

SUBMITTABLE_STATUSES = ("STARTED", "IN_PROGRESS")


class ProviderJobCompletionService:
    def __init__(
        self,
        completions: Any,
        bookings: Any,
        notifications: Any | None = None,
    ) -> None:
        self._completions = completions
        self._bookings = bookings
        self._notifications = notifications

    # -- complete the job --------------------------------------------------------

    async def complete(
        self,
        provider_id: str,
        booking_id: str,
        completion_notes: str | None = None,
        work_performed: str | None = None,
        materials_summary: str | None = None,
        before_after_evidence: list[str] | None = None,
        warranty_details: str | None = None,
        recommended_followup: str | None = None,
        maintenance_recommendations: str | None = None,
    ) -> dict[str, Any]:
        notes = completion_notes.strip() if isinstance(completion_notes, str) else None
        work = work_performed.strip() if isinstance(work_performed, str) else None
        if not (notes or work):
            raise AuthorizationError(
                "completion_notes or work_performed is required"
            )

        # Ownership + active-work guard surface (mirrors the SQL guard).
        booking = await self._bookings.get(provider_id, booking_id)
        if not booking:
            raise NotFoundError(f"Booking {booking_id} not found for this provider")
        if booking.get("status") not in SUBMITTABLE_STATUSES:
            raise AuthorizationError(
                "The job can only be completed while work is active "
                f"(current: {booking.get('status')})"
            )

        evidence = [
            str(e).strip()
            for e in (before_after_evidence or [])
            if str(e).strip()
        ]

        row = await self._completions.submit(
            provider_id=provider_id,
            booking_id=booking_id,
            params={
                "completion_notes": notes,
                "work_performed": work,
                "materials_summary": materials_summary,
                "before_after_evidence": evidence,
                "warranty_details": warranty_details,
                "recommended_followup": recommended_followup,
                "maintenance_recommendations": maintenance_recommendations,
            },
        )
        if not row:
            # SQL guard tripped (already completed / not active / not owned).
            raise AuthorizationError(
                "Could not complete the job — the booking must be active, "
                "owned by this provider and not already completed"
            )
        result = self._decode_evidence(row)

        # "Provider has completed the job." — customer confirms next (Phase 26).
        if self._notifications is not None and row.get("customer_id"):
            await self._notifications.notify(
                str(row["customer_id"]),
                ntype="SERVICE.COMPLETION_REQUESTED",
                title="Provider has completed the job",
                body=f"{booking.get('booking_number')} — review and confirm "
                     f"completion.",
                ref_type="BOOKING",
                ref_id=booking_id,
            )
        return result

    # -- read ----------------------------------------------------------------------

    async def get_report(
        self, provider_id: str, booking_id: str
    ) -> dict[str, Any]:
        row = await self._completions.get(
            provider_id=provider_id, booking_id=booking_id
        )
        if not row:
            raise NotFoundError(
                f"No completion report for booking {booking_id}"
            )
        return self._decode_evidence(row)

    # -- helpers ---------------------------------------------------------------------

    def _decode_evidence(self, row: dict[str, Any]) -> dict[str, Any]:
        data = dict(row)
        ev = data.get("before_after_evidence")
        if isinstance(ev, str):
            try:
                import json

                ev = json.loads(ev)
            except Exception:
                ev = []
        data["before_after_evidence"] = [str(e) for e in (ev or [])]
        return data
