"""ProviderVerificationService — identity documents + verification workflow (Provider Req Phase 5).

Provider side: browse the governed doc-type catalogue, upload one active
document per type, withdraw not-yet-verified ones, track progress and submit
the package for review (every required type must have an active document).
Platform side (consumed later by the admin module behind an admin guard):
per-document review decisions and provider verification_status transitions.
Storage goes through ProviderVerificationRepository; events through the
EventManager port.
"""
from __future__ import annotations

import uuid
from datetime import date, datetime
from decimal import Decimal
from typing import Any

_REVIEW_DECISIONS = ("VERIFIED", "REJECTED", "MORE_INFO_REQUIRED")

_PROVIDER_VERIFICATION_STATUSES = (
    "NOT_SUBMITTED",
    "SUBMITTED",
    "UNDER_REVIEW",
    "VERIFIED",
    "REJECTED",
    "MORE_INFO_REQUIRED",
)


class ProviderVerificationService:
    def __init__(self, verification: Any, events: Any = None) -> None:
        self._verification = verification
        self._events = events

    # -- provider queries ------------------------------------------------------

    async def doc_types(self) -> list[dict[str, Any]]:
        return [self._json_safe(dict(row)) for row in await self._verification.doc_types()]

    async def documents(self, provider_id: str) -> list[dict[str, Any]]:
        rows = await self._verification.list_documents(provider_id)
        return [self._json_safe(dict(row)) for row in rows]

    async def status(self, provider_id: str) -> dict[str, Any]:
        row = await self._verification.status_aggregate(provider_id)
        if not row:
            from app.shared.exceptions.hierarchy import NotFoundError

            raise NotFoundError("Provider not found")
        return self._json_safe(dict(row))

    # -- provider commands -----------------------------------------------------

    async def add_document(self, provider_id: str, data: dict[str, Any]) -> dict[str, Any]:
        from app.shared.exceptions.hierarchy import NotFoundError, ValidationError

        doc_type = str(data.get("doc_type") or "").strip().upper()
        if not doc_type:
            raise ValidationError("doc_type is required")
        catalogue = {t["code"] for t in await self._verification.doc_types()}
        if doc_type not in catalogue:
            raise NotFoundError(f"Unknown document type '{doc_type}'")

        front = str(data.get("front_image_url") or "").strip()
        if not front:
            raise ValidationError("front_image_url is required")
        if len(front) > 500:
            raise ValidationError("front_image_url exceeds 500 characters")
        back = data.get("back_image_url")
        back = str(back).strip() if back else None
        if back and len(back) > 500:
            raise ValidationError("back_image_url exceeds 500 characters")

        number = data.get("doc_number")
        number = str(number).strip() if number is not None else None
        if number and len(number) > 80:
            raise ValidationError("doc_number exceeds 80 characters")

        issue_date = self._as_date(data.get("issue_date"))
        expiry_date = self._as_date(data.get("expiry_date"))
        if expiry_date is not None:
            if issue_date is not None and expiry_date < issue_date:
                raise ValidationError("expiry_date cannot precede issue_date")
            if expiry_date < date.today():
                raise ValidationError("document has already expired")

        row = await self._verification.add_document(
            provider_id,
            doc_type,
            front,
            back_image_url=back or None,
            doc_number=number or None,
            issue_date=issue_date,
            expiry_date=expiry_date,
        )
        if not row:
            raise NotFoundError(f"Unknown document type '{doc_type}'")
        await self._emit(
            provider_id,
            "provider.verification.document_added",
            {"doc_type": doc_type},
        )
        return self._json_safe(dict(row))

    async def withdraw_document(self, provider_id: str, doc_id: str) -> dict[str, Any]:
        from app.shared.exceptions.hierarchy import ConflictError, NotFoundError

        existing = next(
            (d for d in await self._verification.list_documents(provider_id)
             if str(d["doc_id"]) == str(doc_id)),
            None,
        )
        if existing is None:
            raise NotFoundError("Document not found")
        if existing["status"] == "VERIFIED":
            raise ConflictError(
                "A verified document cannot be withdrawn — contact platform support"
            )
        row = await self._verification.delete_document(provider_id, doc_id)
        if not row:
            raise NotFoundError("Document not found")
        await self._emit(
            provider_id,
            "provider.verification.document_withdrawn",
            {"doc_type": existing["doc_type"]},
        )
        return {"doc_id": str(doc_id), "doc_type": existing["doc_type"], "status": "WITHDRAWN"}

    async def submit(self, provider_id: str) -> dict[str, Any]:
        from app.shared.exceptions.hierarchy import ConflictError, ValidationError

        catalogue = await self._verification.doc_types()
        required = [t["code"] for t in catalogue if t["is_required"]]
        present = {d["doc_type"] for d in await self._verification.list_documents(provider_id)}
        missing = [code for code in required if code not in present]
        if missing:
            raise ValidationError(
                "Cannot submit for review — upload the required documents first: "
                + ", ".join(missing)
            )

        row = await self._verification.submit(provider_id)
        if not row:
            raise ConflictError(
                "Verification package cannot be submitted — it may already be "
                "under review or verified"
            )
        await self._emit(provider_id, "provider.verification.submitted", {})
        return {"verification_status": row["verification_status"]}

    # -- platform commands (admin-guarded when the admin module lands) ----------

    async def review_document(
        self,
        doc_id: str,
        reviewer_id: str,
        decision: str,
        review_notes: str | None = None,
    ) -> dict[str, Any]:
        from app.shared.exceptions.hierarchy import NotFoundError, ValidationError

        try:
            parsed_doc_id = str(uuid.UUID(str(doc_id)))
        except ValueError:
            raise NotFoundError("Document not found") from None
        normalized = str(decision or "").strip().upper()
        if normalized not in _REVIEW_DECISIONS:
            raise ValidationError(
                "decision must be one of: " + ", ".join(_REVIEW_DECISIONS)
            )
        notes = str(review_notes).strip() if review_notes else None
        if normalized != "VERIFIED" and not notes:
            raise ValidationError("review_notes are required unless the decision is VERIFIED")

        row = await self._verification.review_document(
            parsed_doc_id, str(reviewer_id), normalized, notes
        )
        if not row:
            raise NotFoundError("Document not found")
        result = self._json_safe(dict(row))
        await self._emit(
            str(row.get("provider_id", "")),
            "provider.verification.document_reviewed",
            {"doc_type": row.get("doc_type"), "decision": normalized, "reviewer_id": str(reviewer_id)},
        )
        return result

    async def set_provider_status(self, provider_id: str, status: str) -> dict[str, Any]:
        from app.shared.exceptions.hierarchy import NotFoundError, ValidationError

        normalized = str(status or "").strip().upper()
        if normalized not in _PROVIDER_VERIFICATION_STATUSES:
            raise ValidationError(
                "status must be one of: " + ", ".join(_PROVIDER_VERIFICATION_STATUSES)
            )
        row = await self._verification.set_provider_status(provider_id, normalized)
        if not row:
            raise NotFoundError("Provider not found")
        await self._emit(provider_id, "provider.verification.status_changed", {"verification_status": normalized})
        return {"provider_id": str(provider_id), "verification_status": normalized}

    # -- helpers ---------------------------------------------------------------

    def _as_date(self, value: Any) -> date | None:
        if value is None or isinstance(value, date):
            return value
        if isinstance(value, datetime):
            return value.date()
        if isinstance(value, str) and value.strip():
            try:
                return date.fromisoformat(value.strip())
            except ValueError:
                from app.shared.exceptions.hierarchy import ValidationError

                raise ValidationError("dates must be ISO format (YYYY-MM-DD)") from None
        return None

    def _json_safe(self, record: dict[str, Any]) -> dict[str, Any]:
        for key, value in record.items():
            if isinstance(value, datetime):
                record[key] = value.isoformat()
            elif isinstance(value, date):
                record[key] = value.isoformat()
            elif isinstance(value, Decimal):
                record[key] = float(value)
            elif isinstance(value, uuid.UUID):
                record[key] = str(value)
        return record

    async def _emit(self, provider_id: str, event_type: str, payload: dict[str, Any]) -> None:
        if self._events is None:
            return
        try:
            from app.events.event import make_event

            await self._events.publish(
                make_event(event_type, {"provider_id": provider_id, **payload})
            )
        except Exception:  # noqa: BLE001 — side effects must never break the command
            pass
