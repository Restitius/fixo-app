"""ProviderQuotationSqlAdapter — implements ProviderQuotationRepository.

This is the ONLY place PRV.QUOTE.* query IDs appear.
"""
from __future__ import annotations

from decimal import Decimal, InvalidOperation
from typing import Any

from app.platform.query.sql_query_manager import SQLQueryManager
from app.shared.exceptions.hierarchy import ValidationError

_AMOUNT_FIELDS = (
    "labour_cost", "materials_cost", "transport_cost", "inspection_fee",
    "additional_charges", "tax_amount", "discount_amount", "platform_fee",
)


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


class ProviderQuotationQueryIds:
    SAVE = "PRV.QUOTE.SAVE"
    SUBMIT = "PRV.QUOTE.SUBMIT"
    WITHDRAW = "PRV.QUOTE.WITHDRAW"
    EXPIRE = "PRV.QUOTE.EXPIRE"
    GET = "PRV.QUOTE.GET"
    LIST = "PRV.QUOTE.LIST"
    ATTACHMENTS_LIST = "PRV.QUOTE.ATTACHMENTS.LIST"
    ATTACHMENTS_ADD = "PRV.QUOTE.ATTACHMENTS.ADD"
    ATTACHMENTS_REMOVE = "PRV.QUOTE.ATTACHMENTS.REMOVE"


class ProviderQuotationSqlAdapter:
    """Implements ProviderQuotationRepository.

    SQLAlchemy ``text()`` requires every named bind to be present — the full
    parameter set is always supplied (Phase 3 lesson).
    """

    def __init__(self, sql_manager: SQLQueryManager) -> None:
        self._sql = sql_manager

    async def save(
        self, provider_id: str, request_id: str, data: dict[str, Any]
    ) -> Any | None:
        params: dict[str, Any] = {
            "user_id": provider_id,
            "request_id": request_id,
            "amount": _as_decimal(data.get("total_amount") or data.get("amount")),
            "currency": data.get("currency") or "TZS",
            "lead_time_days": int(data.get("lead_time_days", 1)),
            **{field: _as_decimal(data.get(field)) for field in _AMOUNT_FIELDS},
            "estimated_hours": data.get("estimated_hours"),
            "proposed_start_date": data.get("proposed_start_date"),
            "notes": data.get("notes"),
            "terms": data.get("terms"),
        }
        return await self._sql.execute(
            ProviderQuotationQueryIds.SAVE, params, fetch="one"
        )

    async def submit(self, provider_id: str, quote_id: str) -> Any | None:
        return await self._sql.execute(
            ProviderQuotationQueryIds.SUBMIT,
            {"user_id": provider_id, "quote_id": quote_id},
            fetch="one",
        )

    async def withdraw(self, provider_id: str, quote_id: str) -> Any | None:
        return await self._sql.execute(
            ProviderQuotationQueryIds.WITHDRAW,
            {"user_id": provider_id, "quote_id": quote_id},
            fetch="one",
        )

    async def expire(self, provider_id: str) -> list[dict[str, Any]]:
        return await self._sql.execute(
            ProviderQuotationQueryIds.EXPIRE, {"user_id": provider_id}
        ) or []

    async def get(self, provider_id: str, quote_id: str) -> Any | None:
        return await self._sql.execute(
            ProviderQuotationQueryIds.GET,
            {"user_id": provider_id, "quote_id": quote_id},
            fetch="one",
        )

    async def list(self, provider_id: str) -> list[dict[str, Any]]:
        return await self._sql.execute(
            ProviderQuotationQueryIds.LIST, {"user_id": provider_id}
        ) or []

    async def list_attachments(
        self, provider_id: str, quote_id: str
    ) -> list[dict[str, Any]]:
        return await self._sql.execute(
            ProviderQuotationQueryIds.ATTACHMENTS_LIST,
            {"user_id": provider_id, "quote_id": quote_id},
        ) or []

    async def add_attachment(
        self, provider_id: str, quote_id: str, data: dict[str, Any]
    ) -> Any | None:
        return await self._sql.execute(
            ProviderQuotationQueryIds.ATTACHMENTS_ADD,
            {
                "user_id": provider_id,
                "quote_id": quote_id,
                "kind": data.get("kind"),
                "url": data.get("url"),
                "label": data.get("label"),
            },
            fetch="one",
        )

    async def remove_attachment(
        self, provider_id: str, attachment_id: str
    ) -> Any | None:
        return await self._sql.execute(
            ProviderQuotationQueryIds.ATTACHMENTS_REMOVE,
            {"user_id": provider_id, "attachment_id": attachment_id},
            fetch="one",
        )