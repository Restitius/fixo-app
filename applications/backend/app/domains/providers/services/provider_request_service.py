"""ProviderIncomingRequestService — incoming job requests (Provider Req Phase 11).

The provider-side job lifecycle entry point: the matched request feed (full
context — service, location, property, estimated earnings from the
provider's own pricing, and a 4-hour response countdown), the four actions
(Accept / Decline / Submit Quote / Ask Question) and the response ledger
that feeds the dashboard's acceptance-rate metrics. Responses land in
PROVIDER_REQUEST_RESPONSES; quotes go to the existing QUOTATIONS table.
"""
from __future__ import annotations

from datetime import date, datetime, timedelta, timezone
from decimal import Decimal, InvalidOperation
from typing import Any
from uuid import UUID

from app.shared.exceptions.hierarchy import ConflictError, NotFoundError, ValidationError

_RESPONSE_TYPES = ("ACCEPTED", "DECLINED", "QUESTION")


class ProviderIncomingRequestService:
    """Owns the feed rules and the response/quote actions."""

    def __init__(self, requests: Any, events: Any = None) -> None:
        self._requests = requests
        self._events = events

    # -- queries ---------------------------------------------------------------

    async def feed(self, provider_id: str) -> list[dict[str, Any]]:
        """Matched requests awaiting a response, with remaining countdown."""
        now = datetime.now(timezone.utc)
        rows = await self._requests.feed(provider_id)
        return [self._with_countdown(row, now) for row in rows]

    async def get(self, provider_id: str, request_id: str) -> dict[str, Any]:
        """One feed item's detail."""
        self._validate_request_id(request_id)
        row = await self._requests.get(provider_id, request_id)
        if row is None:
            raise NotFoundError("Request is not in your incoming feed")
        return self._with_countdown(row, datetime.now(timezone.utc))

    async def responses_list(self, provider_id: str) -> list[dict[str, Any]]:
        """The provider's response ledger (feeds acceptance metrics)."""
        rows = await self._requests.responses_list(provider_id)
        return [self._json_safe(dict(row)) for row in rows]

    async def quotes_list(self, provider_id: str) -> list[dict[str, Any]]:
        """The provider's submitted quotes."""
        rows = await self._requests.quotes_list(provider_id)
        return [self._json_safe(dict(row)) for row in rows]

    # -- commands -----------------------------------------------------------------

    async def respond(
        self, provider_id: str, request_id: str, data: dict[str, Any]
    ) -> dict[str, Any]:
        """Accept / Decline / Ask Question on a matched request."""
        self._validate_request_id(request_id)
        response_type = data.get("response_type")
        if response_type not in _RESPONSE_TYPES:
            raise ValidationError(
                "response_type must be one of: " + ", ".join(_RESPONSE_TYPES)
            )
        if response_type == "QUESTION" and not (data.get("question_text") or "").strip():
            raise ValidationError("A question requires question_text")
        payload = {
            "response_type": response_type,
            "question_text": data.get("question_text"),
            "response_message": data.get("response_message"),
        }

        row = await self._requests.respond(provider_id, request_id, payload)
        if row is None:
            raise ConflictError(
                "Request is not in your incoming feed or was already "
                "accepted/declined"
            )
        result = self._json_safe(dict(row))
        await self._emit(
            provider_id,
            "provider.request.responded",
            {"request_id": request_id, "response_type": response_type},
        )
        return result

    async def submit_quote(
        self, provider_id: str, request_id: str, data: dict[str, Any]
    ) -> dict[str, Any]:
        """Submit this provider's quote for a matched request."""
        self._validate_request_id(request_id)
        amount = self._positive_amount("amount", data.get("amount"))
        lead_time = int(data.get("lead_time_days", 1))
        if lead_time < 0:
            raise ValidationError("lead_time_days must be zero or greater")

        # Friendly pre-checks before the SQL guard's generic rejection.
        current = await self._requests.get(provider_id, request_id)
        if current is None:
            raise NotFoundError("Request is not in your incoming feed")
        if current.get("my_quote_id"):
            raise ConflictError("You already submitted a quote for this request")

        payload = {
            "amount": amount,
            "currency": data.get("currency") or "TZS",
            "lead_time_days": lead_time,
            "message": data.get("message"),
        }
        row = await self._requests.submit_quote(provider_id, request_id, payload)
        if row is None:
            raise ConflictError(
                "Quote rejected — request no longer active or already quoted"
            )
        result = self._json_safe(dict(row))
        await self._emit(
            provider_id,
            "provider.request.quote_submitted",
            {"request_id": request_id, "quote_id": result.get("quote_id"),
             "amount": float(amount)},
        )
        return result

    # -- helpers -----------------------------------------------------------------

    def _with_countdown(
        self, row: Any, now: datetime
    ) -> dict[str, Any]:
        """Add respond_in_seconds/respond_expired to a (mapper-sanitized) row.

        The platform ResultMapper already converts timestamps to ISO strings,
        so the deadline may arrive as a string or a datetime depending on the
        driver path — handle both.
        """
        item = self._json_safe(dict(row))
        respond_by = item.get("respond_by")
        deadline: datetime | None = None
        if isinstance(respond_by, datetime):
            deadline = respond_by
        elif isinstance(respond_by, str) and respond_by:
            try:
                deadline = datetime.fromisoformat(respond_by)
            except ValueError:
                deadline = None
        if deadline is not None:
            if deadline.tzinfo is None:
                deadline = deadline.replace(tzinfo=timezone.utc)
            remaining = (deadline - now).total_seconds()
            item["respond_in_seconds"] = max(0, int(remaining))
            item["respond_expired"] = remaining <= 0
        return item

    @staticmethod
    def _validate_request_id(request_id: str) -> None:
        """Malformed ids are a client 404, never a database DataError (Phase 5 lesson)."""
        try:
            UUID(str(request_id))
        except (ValueError, AttributeError, TypeError) as exc:
            raise NotFoundError("Request is not in your incoming feed") from exc

    @staticmethod
    def _positive_amount(name: str, value: Any) -> Decimal:
        try:
            amount = Decimal(str(value))
        except (InvalidOperation, ValueError, TypeError) as exc:
            raise ValidationError(f"{name} must be a valid amount") from exc
        if amount <= 0:
            raise ValidationError(f"{name} must be greater than zero")
        return amount

    def _json_safe(self, row: dict[str, Any]) -> dict[str, Any]:
        for key, value in row.items():
            if isinstance(value, (datetime, date)):
                row[key] = value.isoformat()
            elif isinstance(value, Decimal):
                row[key] = float(value)
            elif isinstance(value, UUID):
                row[key] = str(value)
            elif isinstance(value, timedelta):
                row[key] = value.total_seconds()
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