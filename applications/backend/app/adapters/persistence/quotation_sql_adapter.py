"""QuotationSqlAdapter — implements QuotationRepository via governed queries."""
from __future__ import annotations

from typing import Any

from app.platform.query.sql_query_manager import SQLQueryManager


class QuoteQueryIds:
    AUTO_CREATE = "CUS.QUOTES.AUTO_CREATE"
    LIST = "CUS.QUOTES.LIST"
    GET_OWNED = "CUS.QUOTES.GET"
    ACCEPT = "CUS.QUOTES.ACCEPT"


class QuotationSqlAdapter:
    def __init__(self, sql_manager: SQLQueryManager) -> None:
        self._sql = sql_manager

    async def auto_create(
        self, request_id: str, quote: dict[str, Any]
    ) -> dict[str, Any] | None:
        return await self._sql.execute(
            QuoteQueryIds.AUTO_CREATE,
            {
                "request_id": request_id,
                "provider_id": quote["provider_id"],
                "amount": quote["amount"],
                "lead_time_days": int(quote.get("lead_time_days", 1)),
                "message": quote.get("message"),
            },
            fetch="one",
        )

    async def list_for_request(
        self, customer_id: str, request_id: str
    ) -> list[dict[str, Any]]:
        rows = await self._sql.execute(
            QuoteQueryIds.LIST,
            {"customer_id": customer_id, "request_id": request_id},
            fetch="all",
        )
        return list(rows or [])

    async def get_owned(
        self, customer_id: str, quote_id: str
    ) -> dict[str, Any] | None:
        return await self._sql.execute(
            QuoteQueryIds.GET_OWNED,
            {"customer_id": customer_id, "quote_id": quote_id},
            fetch="one",
        )

    async def accept(
        self, customer_id: str, request_id: str, quote_id: str
    ) -> bool:
        row = await self._sql.execute(
            QuoteQueryIds.ACCEPT,
            {"customer_id": customer_id, "request_id": request_id,
             "quote_id": quote_id},
            fetch="one",
        )
        return bool((row or {}).get("accepted"))