"""ProviderQuotationService — professional quotations (Provider Req Phase 13).

Some services require quotations rather than instant acceptance. The provider
builds a DRAFT quote with an itemised breakdown (labour, materials, transport,
inspection, additional, taxes, discount, optional platform fee, total price,
estimated duration, proposed start date), attaches photos/documents, then
submits it into the marketplace. Status lifecycle: DRAFT → SUBMITTED → VIEWED
→ ACCEPTED/REJECTED/EXPIRED/WITHDRAWN. Persistence goes through
ProviderQuotationRepository; the provider owns its quotes — ownership is
enforced in SQL and in every service guard.
"""
from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal, InvalidOperation
from typing import Any
from uuid import UUID

from app.shared.exceptions.hierarchy import (
    ConflictError,
    NotFoundError,
    ValidationError,
)

_AMOUNT_FIELDS = (
    "labour_cost", "materials_cost", "transport_cost", "inspection_fee",
    "additional_charges", "tax_amount", "discount_amount", "platform_fee",
)
_ATTACH_KINDS = ("PHOTO", "DOCUMENT")


class ProviderQuotationService:
    """Owns the professional-quotation rules and lifecycle."""

    def __init__(self, quotations: Any, events: Any = None) -> None:
        self._quotations = quotations
        self._events = events

    # -- queries ------------------------------------------------------------------

    async def get(self, provider_id: str, quote_id: str) -> dict[str, Any]:
        """One of this provider's quotes with full breakdown."""
        self._validate_uuid(quote_id, "Quote")
        row = await self._quotations.get(provider_id, quote_id)
        if row is None:
            raise NotFoundError("Quote not found")
        return self._json_safe(dict(row))

    async def list(self, provider_id: str) -> list[dict[str, Any]]:
        """This provider's quotes, newest first (expiring stale ones up front)."""
        await self._quotations.expire(provider_id)
        rows = await self._quotations.list(provider_id)
        return [self._json_safe(dict(row)) for row in rows]

    async def get_attachments(
        self, provider_id: str, quote_id: str
    ) -> list[dict[str, Any]]:
        """Attachments on one of my quotes."""
        self._validate_uuid(quote_id, "Quote")
        rows = await self._quotations.list_attachments(provider_id, quote_id)
        return [self._json_safe(dict(row)) for row in rows]

    # -- commands -------------------------------------------------------------------

    async def save(
        self, provider_id: str, request_id: str, data: dict[str, Any]
    ) -> dict[str, Any]:
        """Create a DRAFT or upgrade my quote with a professional breakdown."""
        self._validate_uuid(request_id, "Request")
        self._validate_breakdown(data, partial=bool(data.get("quote_id")))
        payload = self._normalise(data)
        payload["proposed_start_date"] = self._parse_date_iso(data.get("proposed_start_date"))
        row = await self._quotations.save(provider_id, request_id, payload)
        if row is None:
            raise ConflictError(
                "Quote rejected — the request is not in your incoming feed, "
                "or an existing quote is in a terminal state (accepted/"
                "rejected/expired/withdrawn)"
            )
        result = self._json_safe(dict(row))
        await self._emit(
            provider_id,
            "provider.quote.draft_saved",
            {"request_id": request_id, "quote_id": result.get("quote_id")},
        )
        return result

    async def submit(self, provider_id: str, quote_id: str) -> dict[str, Any]:
        """Publish a DRAFT quote into the marketplace (DRAFT → SUBMITTED)."""
        self._validate_uuid(quote_id, "Quote")
        row = await self._quotations.submit(provider_id, quote_id)
        if row is None:
            raise ConflictError("Only a DRAFT quote you own can be submitted")
        result = self._json_safe(dict(row))
        await self._emit(
            provider_id, "provider.quote.submitted", {"quote_id": quote_id}
        )
        return result

    async def withdraw(self, provider_id: str, quote_id: str) -> dict[str, Any]:
        """Withdraw a submitted quote (SUBMITTED → WITHDRAWN)."""
        self._validate_uuid(quote_id, "Quote")
        row = await self._quotations.withdraw(provider_id, quote_id)
        if row is None:
            raise ConflictError("Only a SUBMITTED quote you own can be withdrawn")
        result = self._json_safe(dict(row))
        await self._emit(
            provider_id, "provider.quote.withdrawn", {"quote_id": quote_id}
        )
        return result

    async def expire(self, provider_id: str) -> list[dict[str, Any]]:
        """Mark stale submitted quotes expired (idempotent maintainer)."""
        rows = await self._quotations.expire(provider_id)
        return [self._json_safe(dict(row)) for row in rows]

    async def add_attachment(
        self, provider_id: str, quote_id: str, data: dict[str, Any]
    ) -> dict[str, Any]:
        """Attach a photo/document to my own DRAFT/SUBMITTED quote."""
        self._validate_uuid(quote_id, "Quote")
        kind = data.get("kind")
        if kind not in _ATTACH_KINDS:
            raise ValidationError("kind must be one of: " + ", ".join(_ATTACH_KINDS))
        if not (data.get("url") or "").strip():
            raise ValidationError("url is required")
        row = await self._quotations.add_attachment(provider_id, quote_id, data)
        if row is None:
            raise NotFoundError(
                "Quote not found, or attachments are locked once the quote "
                "is viewed/accepted/rejected/expired/withdrawn"
            )
        return self._json_safe(dict(row))

    async def remove_attachment(
        self, provider_id: str, attachment_id: str
    ) -> dict[str, Any]:
        """Delete one of my attachment rows (own quote, DRAFT/SUBMITTED only)."""
        self._validate_uuid(attachment_id, "Attachment")
        row = await self._quotations.remove_attachment(provider_id, attachment_id)
        if row is None:
            raise NotFoundError(
                "Attachment not found, or the quote is no longer editable"
            )
        return self._json_safe(dict(row))

    # -- helpers ---------------------------------------------------------------------

    def _validate_breakdown(
        self, data: dict[str, Any], *, partial: bool
    ) -> None:
        """Validate amounts on save; for drafts amounts may come later."""
        for name in _AMOUNT_FIELDS:
            value = data.get(name)
            if value is None:
                continue
            try:
                amount = Decimal(str(value))
            except (InvalidOperation, ValueError, TypeError) as exc:
                raise ValidationError(f"{name} must be a valid amount") from exc
            if amount < 0:
                raise ValidationError(f"{name} must be zero or greater")
        if not partial:
            total = data.get("total_amount") or data.get("amount")
            if total is None:
                raise ValidationError("total_amount is required")
        est = data.get("estimated_hours")
        if est is not None:
            try:
                if int(est) < 1:
                    raise ValueError
            except (TypeError, ValueError) as exc:
                raise ValidationError(
                    "estimated_hours must be a positive integer"
                ) from exc

    @staticmethod
    def _normalise(data: dict[str, Any]) -> dict[str, Any]:
        """Pass through the fields the adapter binds, with safe defaults."""
        payload = {name: data.get(name) for name in _AMOUNT_FIELDS}
        payload.update({
            "total_amount": data.get("total_amount") or data.get("amount"),
            "currency": data.get("currency") or "TZS",
            "lead_time_days": data.get("lead_time_days", 1),
            "estimated_hours": data.get("estimated_hours"),
            "proposed_start_date": data.get("proposed_start_date"),
            "notes": data.get("notes"),
            "terms": data.get("terms"),
        })
        return payload

    @staticmethod
    def _parse_date_iso(value: Any) -> date | None:
        """asyncpg binds native date objects for DATE columns (Phase 3 lesson)."""
        if value is None or value == "":
            return None
        if isinstance(value, date):
            return value
        try:
            return date.fromisoformat(str(value))
        except (ValueError, TypeError) as exc:
            raise ValidationError(
                "proposed_start_date must be an ISO date like '2026-09-20'"
            ) from exc

    @staticmethod
    def _validate_uuid(value: str, what: str) -> None:
        """Malformed ids are a client 404, never a database DataError (Phase 5 lesson)."""
        try:
            UUID(str(value))
        except (ValueError, AttributeError, TypeError) as exc:
            raise NotFoundError(f"{what} not found") from exc

    @staticmethod
    def _json_safe(row: dict[str, Any]) -> dict[str, Any]:
        for key, value in row.items():
            if isinstance(value, (datetime, date)):
                row[key] = value.isoformat()
            elif isinstance(value, Decimal):
                row[key] = float(value)
            elif isinstance(value, UUID):
                row[key] = str(value)
        return row

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