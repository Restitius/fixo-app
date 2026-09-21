"""ProviderJobEvidenceService — evidence & job documentation (Requirement Phase 22).

Providers document work against a booking: before/during/after photos,
videos, notes, measurements, customer instructions and replacement
parts. Each evidence item is validated for kind/phase and the required
payload for its kind before it is stored.
"""
from __future__ import annotations

from typing import Any

from app.shared.exceptions.hierarchy import AuthorizationError, NotFoundError

EVIDENCE_PHASES = ("BEFORE", "DURING", "AFTER")
EVIDENCE_KINDS = (
    "PHOTO",
    "VIDEO",
    "NOTE",
    "MEASUREMENT",
    "INSTRUCTION",
    "PART",
)
MEDIA_KINDS = ("PHOTO", "VIDEO")
TEXT_KINDS = ("NOTE", "MEASUREMENT", "INSTRUCTION", "PART")


class ProviderJobEvidenceService:
    def __init__(self, evidence: Any) -> None:
        self._evidence = evidence

    # -- write ----------------------------------------------------------------

    async def add(
        self,
        provider_id: str,
        booking_id: str,
        phase: str,
        kind: str,
        title: str | None = None,
        body: str | None = None,
        media_url: str | None = None,
        quantity: float | None = None,
        unit: str | None = None,
    ) -> dict[str, Any]:
        phase_u = str(phase or "").strip().upper()
        kind_u = str(kind or "").strip().upper()
        if phase_u not in EVIDENCE_PHASES:
            raise AuthorizationError(
                f"Evidence phase must be one of {', '.join(EVIDENCE_PHASES)}"
            )
        if kind_u not in EVIDENCE_KINDS:
            raise AuthorizationError(
                f"Evidence kind must be one of {', '.join(EVIDENCE_KINDS)}"
            )
        clean_title = title.strip() if isinstance(title, str) else None
        clean_body = body.strip() if isinstance(body, str) else None
        clean_media = media_url.strip() if isinstance(media_url, str) else None
        clean_unit = unit.strip() if isinstance(unit, str) else None

        if kind_u in MEDIA_KINDS and not clean_media:
            raise AuthorizationError(
                f"media_url is required for {kind_u.lower()} evidence"
            )
        if kind_u in TEXT_KINDS and not (clean_body or clean_title):
            raise AuthorizationError(
                f"a note body or title is required for {kind_u.lower()} evidence"
            )

        row = await self._evidence.add(
            provider_id=provider_id,
            booking_id=booking_id,
            phase=phase_u,
            kind=kind_u,
            title=clean_title,
            body=clean_body,
            media_url=clean_media,
            quantity=quantity,
            unit=clean_unit,
        )
        if not row:
            raise NotFoundError(f"Booking {booking_id} not found for this provider")
        return row

    # -- read -----------------------------------------------------------------

    async def list_for_booking(
        self,
        provider_id: str,
        booking_id: str,
        phase: str | None = None,
        kind: str | None = None,
    ) -> dict[str, Any]:
        phase_u = str(phase).strip().upper() if phase else None
        kind_u = str(kind).strip().upper() if kind else None
        if phase_u is not None and phase_u not in EVIDENCE_PHASES:
            raise AuthorizationError(
                f"Evidence phase must be one of {', '.join(EVIDENCE_PHASES)}"
            )
        if kind_u is not None and kind_u not in EVIDENCE_KINDS:
            raise AuthorizationError(
                f"Evidence kind must be one of {', '.join(EVIDENCE_KINDS)}"
            )
        rows = await self._evidence.list_for_booking(
            provider_id=provider_id,
            booking_id=booking_id,
            phase=phase_u,
            kind=kind_u,
        )
        return {"booking_id": booking_id, "items": [dict(r) for r in rows]}

    async def summary(
        self, provider_id: str, booking_id: str
    ) -> dict[str, Any]:
        rows = await self._evidence.summary(
            provider_id=provider_id, booking_id=booking_id
        )
        return {
            "booking_id": booking_id,
            "summary": [
                {
                    "phase": r.get("phase"),
                    "kind": r.get("kind"),
                    "count": int(r.get("count") or 0),
                }
                for r in rows
            ],
        }

    # -- delete ---------------------------------------------------------------

    async def delete(
        self, provider_id: str, booking_id: str, evidence_id: str
    ) -> dict[str, Any]:
        row = await self._evidence.delete(
            provider_id=provider_id, evidence_id=evidence_id
        )
        if not row or str(row.get("booking_id")) != str(booking_id):
            raise NotFoundError(
                f"Evidence item {evidence_id} not found for booking {booking_id}"
            )
        return {"evidence_id": evidence_id, "booking_id": booking_id, "deleted": True}
