"""ProviderRequestSqlAdapter — implements ProviderRequestRepository.

This is the ONLY place PRV.REQUESTS.* query IDs appear.
"""
from __future__ import annotations

from decimal import Decimal, InvalidOperation
from typing import Any

from sqlalchemy.exc import IntegrityError

from app.platform.query.sql_query_manager import SQLQueryManager
from app.shared.exceptions.hierarchy import ConflictError, ValidationError


class ProviderRequestQueryIds:
    FEED = "PRV.REQUESTS.FEED"
    GET = "PRV.REQUESTS.GET"
    RESPOND = "PRV.REQUESTS.RESPOND"
    RESPONSES_LIST = "PRV.REQUESTS.RESPONSES.LIST"
    QUOTE_SUBMIT = "PRV.REQUESTS.QUOTE.SUBMIT"
    QUOTES_LIST = "PRV.REQUESTS.QUOTES.LIST"


def _as_decimal(value: Any) -> Decimal | None:
    """asyncpg binds native Decimal for NUMERIC columns (Phase 3 lesson)."""
    if value is None or isinstance(value, Decimal):
        return value
    if isinstance(value, bool):
        raise ValidationError("boolean is not a valid amount")
    if isinstance(value, (int, float)):
        return Decimal(str(value))
    if isinstance(value, str) and value.strip():
        try:
            return Decimal(value.strip())
        except InvalidOperation as exc:
            raise ValidationError(f"'{value}' is not a valid amount") from exc
    return None


class ProviderRequestSqlAdapter:
    """Implements ProviderRequestRepository.

    SQLAlchemy ``text()`` requires every named bind to be present — the full
    parameter set is always supplied (Phase 3 lesson). The respond/quote
    queries are INSERT..SELECT with eligibility guards; a rejected guard
    yields no row (surfaced by the service), while genuine constraint
    violations surface as IntegrityError → ConflictError.
    """

    def __init__(self, sql_manager: SQLQueryManager) -> None:
        self._sql = sql_manager

    async def feed(self, provider_id: str) -> list[dict[str, Any]]:
        return await self._sql.execute(
            ProviderRequestQueryIds.FEED, {"user_id": provider_id}
        ) or []

    async def get(self, provider_id: str, request_id: str) -> Any | None:
        return await self._sql.execute(
            ProviderRequestQueryIds.GET,
            {"user_id": provider_id, "request_id": request_id},
            fetch="one",
        )

    async def respond(
        self, provider_id: str, request_id: str, data: dict[str, Any]
    ) -> Any | None:
        try:
            return await self._sql.execute(
                ProviderRequestQueryIds.RESPOND,
                {
                    "user_id": provider_id,
                    "request_id": request_id,
                    "response_type": data.get("response_type"),
                    "question_text": data.get("question_text"),
                    "response_message": data.get("response_message"),
                },
                fetch="one",
            )
        except IntegrityError as exc:
            raise ConflictError(
                "Response rejected by data constraints"
            ) from exc

    async def responses_list(self, provider_id: str) -> list[dict[str, Any]]:
        return await self._sql.execute(
            ProviderRequestQueryIds.RESPONSES_LIST, {"user_id": provider_id}
        ) or []

    async def submit_quote(
        self, provider_id: str, request_id: str, data: dict[str, Any]
    ) -> Any | None:
        try:
            return await self._sql.execute(
                ProviderRequestQueryIds.QUOTE_SUBMIT,
                {
                    "user_id": provider_id,
                    "request_id": request_id,
                    "amount": _as_decimal(data.get("amount")),
                    "currency": data.get("currency") or "TZS",
                    "lead_time_days": int(data.get("lead_time_days", 1)),
                    "message": data.get("message"),
                },
                fetch="one",
            )
        except IntegrityError as exc:
            raise ConflictError(
                "You have already submitted a quote for this request"
            ) from exc

    async def quotes_list(self, provider_id: str) -> list[dict[str, Any]]:
        return await self._sql.execute(
            ProviderRequestQueryIds.QUOTES_LIST, {"user_id": provider_id}
        ) or []