"""ProviderJobReviewService - customer sign-off / approval evidence (Phase 26).

The customer signs off AFTER receiving "Provider has completed the job."
(status COMPLETION_REQUESTED). The service records the approval evidence and
returns the stored row. Re-submitting refreshes the evidence (one record per
booking). The status transition COMPLETION_REQUESTED -> CUSTOMER_CONFIRMED is
the responsibility of the customer-domain CompletionService.

Provider-side reads:
  - get(booking_id): the sign-off record for one of the provider's bookings
  - waiting(): the provider's bookings still awaiting sign-off beyond the
    24h silent-effectiveness window (triage before the approval silently
    becomes ineffective).
  - delete(review_id): provider removes its sign-off record from a booking.
"""
from __future__ import annotations

from typing import Any

from app.shared.exceptions.hierarchy import AuthorizationError, ValidationError

SIGN_OFF_KINDS = frozenset({
    "DIGITAL_SIGNATURE",
    "COMPLETION_PIN",
    "APP_CONFIRMATION",
})


class ProviderJobReviewService:
    """Domain service for customer sign-off / approval evidence."""

    def __init__(self, reviews: Any) -> None:
        self._reviews = reviews

    # -- submit sign-off ----------------------------------------------------

    async def submit(
        self,
        provider_id: str,
        booking_id: str,
        sign_off: str,
        approval_evidence: str = "",
    ) -> dict[str, Any]:
        sign_off = (sign_off or "").strip().upper()
        if sign_off not in SIGN_OFF_KINDS:
            raise ValidationError(
                f"sign_off must be one of: {', '.join(sorted(SIGN_OFF_KINDS))}"
            )

        approval_evidence = (approval_evidence or "").strip()
        if len(approval_evidence) > 4000:
            raise ValidationError("approval_evidence must be at most 4000 characters")

        row = await self._reviews.submit(
            user_id=provider_id,
            booking_id=booking_id,
            sign_off=sign_off,
            approval_evidence=approval_evidence,
        )
        if row is None:
            raise AuthorizationError(
                "Cannot sign off - the booking must be in COMPLETION_REQUESTED "
                "and not already signed by the customer."
            )
        return self._encode(row)

    # -- get already-signed record ------------------------------------------

    async def get(
        self, provider_id: str, booking_id: str
    ) -> dict[str, Any] | None:
        row = await self._reviews.get(
            user_id=provider_id,
            booking_id=booking_id,
        )
        if row is None:
            return None
        return self._encode(row)

    # -- waiting triage -----------------------------------------------------

    async def waiting(self, provider_id: str) -> list[dict[str, Any]]:
        rows = await self._reviews.waiting(user_id=provider_id)
        return [self._encode_w(w) for w in rows]

    # -- delete sign-off ----------------------------------------------------

    async def delete(
        self, provider_id: str, review_id: str
    ) -> dict[str, Any] | None:
        row = await self._reviews.delete(
            user_id=provider_id,
            review_id=review_id,
        )
        if row is None:
            return None
        return {
            "review_id": str(row.get("review_id") or ""),
            "booking_id": str(row.get("booking_id") or ""),
        }

    # -- encoding -----------------------------------------------------------

    @staticmethod
    def _encode(row: dict[str, Any]) -> dict[str, Any]:
        return {
            "review_id": str(row.get("review_id") or ""),
            "booking_id": str(row.get("booking_id") or ""),
            "provider_id": str(row.get("provider_id") or ""),
            "customer_id": str(row.get("customer_id") or ""),
            "sign_off": str(row.get("sign_off") or ""),
            "approval_evidence": str(row.get("approval_evidence") or ""),
            "signed_at": str(row.get("signed_at") or ""),
            "recorded_at": str(row.get("recorded_at") or ""),
            "booking_status": str(row.get("booking_status") or ""),
        }

    @staticmethod
    def _encode_w(row: dict[str, Any]) -> dict[str, Any]:
        return {
            "booking_id": str(row.get("booking_id") or ""),
            "booking_number": str(row.get("booking_number") or ""),
            "customer_id": str(row.get("customer_id") or ""),
            "status": str(row.get("status") or ""),
            "status_updated_at": str(row.get("status_updated_at") or ""),
            "hours_since_completion_requested": float(
                row.get("hours_since_completion_requested") or 0.0
            ),
        }
