"""ProviderChangeRequestService — scope-change submissions (Requirement Phase 23).

Sometimes the original job scope changes (customer requested "Repair
leaking sink — TZS 30,000"; provider discovers damaged pipes). The
provider submits a Change Request with reason, new work required,
additional labour/materials/time/price and supporting photos. The
customer must approve or reject before additional billable work is
performed — the customer side already decides via the Phase 24 flow
(the side that did NOT propose decides).
"""
from __future__ import annotations

from typing import Any

from app.shared.exceptions.hierarchy import AuthorizationError, NotFoundError

CHANGE_TYPES = ("SCOPE", "TIME", "PRICE")
ACTIVE_STATUSES = ("ARRIVED", "STARTED", "IN_PROGRESS", "COMPLETION_REQUESTED")
CURRENCIES = ("TZS", "USD", "KES", "UGX", "RWF")


class ProviderChangeRequestService:
    def __init__(self, changes: Any, bookings: Any) -> None:
        self._changes = changes
        self._bookings = bookings

    # -- submit ------------------------------------------------------------------

    async def submit(
        self,
        provider_id: str,
        booking_id: str,
        change_type: str,
        proposed_value: str,
        reason: str | None = None,
        new_work: str | None = None,
        additional_labour: float | None = None,
        additional_materials: float | None = None,
        additional_time_minutes: int | None = None,
        additional_price: float | None = None,
        currency: str = "TZS",
        supporting_photos: list[str] | None = None,
    ) -> dict[str, Any]:
        type_u = str(change_type or "").strip().upper()
        if type_u not in CHANGE_TYPES:
            raise AuthorizationError(
                f"change_type must be one of {', '.join(CHANGE_TYPES)}"
            )
        proposed = str(proposed_value or "").strip()
        if not proposed:
            raise AuthorizationError("proposed_value is required")

        curr_u = str(currency or "TZS").strip().upper()
        if curr_u not in CURRENCIES:
            raise AuthorizationError(
                f"currency must be one of {', '.join(CURRENCIES)}"
            )

        photos = [
            str(p).strip() for p in (supporting_photos or []) if str(p).strip()
        ]

        # Ownership + active-work guard surface (mirrors the SQL guard).
        booking = await self._bookings.get(provider_id, booking_id)
        if not booking:
            raise NotFoundError(f"Booking {booking_id} not found for this provider")
        if booking.get("status") not in ACTIVE_STATUSES:
            raise AuthorizationError(
                "Change requests can only be submitted while work is active "
                f"(current: {booking.get('status')})"
            )

        # Current value per change type, captured from the booking aggregate.
        current = {
            "SCOPE": "current scope",
            "TIME": str(booking.get("scheduled_date") or ""),
            "PRICE": f"{booking.get('agreed_amount')} {booking.get('currency')}",
        }[type_u]

        row = await self._changes.submit(
            provider_id=provider_id,
            booking_id=booking_id,
            params={
                "change_type": type_u,
                "current_value": current,
                "proposed_value": proposed,
                "reason": reason,
                "new_work": new_work,
                "additional_labour": additional_labour,
                "additional_materials": additional_materials,
                "additional_time_minutes": additional_time_minutes,
                "additional_price": additional_price,
                "currency": curr_u,
                "supporting_photos": photos,
            },
        )
        if not row:
            # SQL guard tripped (booking not active / not provider-owned).
            raise AuthorizationError(
                "Could not submit the change request — booking must be active "
                "and owned by this provider"
            )
        return self._decode_photos(row)

    # -- helpers ------------------------------------------------------------------

    def _decode_photos(self, row: dict[str, Any]) -> dict[str, Any]:
        data = dict(row)
        photos = data.get("supporting_photos")
        if isinstance(photos, str):
            try:
                import json

                photos = json.loads(photos)
            except Exception:
                photos = []
        data["supporting_photos"] = [str(p) for p in (photos or [])]
        return data

    # -- read ---------------------------------------------------------------------

    async def list_for_booking(
        self, provider_id: str, booking_id: str
    ) -> dict[str, Any]:
        rows = await self._changes.list_for_booking(
            provider_id=provider_id, booking_id=booking_id
        )
        return {
            "booking_id": booking_id,
            "items": [self._decode_photos(r) for r in rows],
        }

    async def get(
        self, provider_id: str, booking_id: str, change_id: str
    ) -> dict[str, Any]:
        row = await self._changes.get_owned(provider_id=provider_id, change_id=change_id)
        if not row or str(row.get("booking_id")) != str(booking_id):
            raise NotFoundError(
                f"Change request {change_id} not found for booking {booking_id}"
            )
        return self._decode_photos(row)

    # -- withdraw -------------------------------------------------------------------

    async def withdraw(
        self, provider_id: str, booking_id: str, change_id: str
    ) -> dict[str, Any]:
        owned = await self._changes.get_owned(
            provider_id=provider_id, change_id=change_id
        )
        if not owned or str(owned.get("booking_id")) != str(booking_id):
            raise NotFoundError(
                f"Change request {change_id} not found for booking {booking_id}"
            )
        if owned.get("requested_by") != "PROVIDER":
            raise AuthorizationError("Only the provider's own requests can be withdrawn")
        row = await self._changes.withdraw(provider_id=provider_id, change_id=change_id)
        if not row:
            raise AuthorizationError("Only PROPOSED requests can be withdrawn")
        return {
            "change_id": change_id,
            "booking_id": booking_id,
            "status": row.get("status"),
            "withdrawn": True,
        }
