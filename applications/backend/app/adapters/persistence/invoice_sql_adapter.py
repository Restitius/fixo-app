"""Invoice SQL adapter — implements InvoiceRepositoryPort."""
from __future__ import annotations
from typing import Any

from app.platform.query.sql_query_manager import SQLQueryManager


class InvoiceQueryIds:
    INVOICE_FINALIZE = "CUS.INVOICE.FINALIZE"
    INVOICE_ISSUE = "CUS.INVOICE.ISSUE"
    INVOICE_GET_BY_BOOKING = "CUS.INVOICE.GET_BY_BOOKING"
    INVOICE_GET_OWNED = "CUS.INVOICE.GET_OWNED"
    INVOICE_LIST = "CUS.INVOICE.LIST"
    INVOICE_MARK_PAID = "CUS.INVOICE.MARK_PAID"


class InvoiceSqlAdapter:
    def __init__(self, sql_manager: SQLQueryManager) -> None:
        self._sql = sql_manager

    async def finalize(self, booking_id: str, customer_id: str) -> dict[str, Any] | None:
        return await self._sql.execute(
            InvoiceQueryIds.INVOICE_FINALIZE,
            {"booking_id": booking_id, "customer_id": customer_id},
            fetch="one",
        )

    async def issue(self, invoice_id: str, customer_id: str) -> dict[str, Any] | None:
        return await self._sql.execute(
            InvoiceQueryIds.INVOICE_ISSUE,
            {"invoice_id": invoice_id, "customer_id": customer_id},
            fetch="one",
        )

    async def get_by_booking(self, booking_id: str, customer_id: str) -> dict[str, Any] | None:
        return await self._sql.execute(
            InvoiceQueryIds.INVOICE_GET_BY_BOOKING,
            {"booking_id": booking_id, "customer_id": customer_id},
            fetch="one",
        )

    async def get_owned(self, invoice_id: str, customer_id: str) -> dict[str, Any] | None:
        return await self._sql.execute(
            InvoiceQueryIds.INVOICE_GET_OWNED,
            {"invoice_id": invoice_id, "customer_id": customer_id},
            fetch="one",
        )

    async def list(self, customer_id: str, page: int, limit: int) -> list[dict[str, Any]]:
        rows = await self._sql.execute(
            InvoiceQueryIds.INVOICE_LIST,
            {"customer_id": customer_id, "page": page, "limit": limit},
            fetch="all",
        )
        return list(rows or [])

    async def mark_paid(self, invoice_id: str, customer_id: str) -> dict[str, Any] | None:
        return await self._sql.execute(
            InvoiceQueryIds.INVOICE_MARK_PAID,
            {"invoice_id": invoice_id, "customer_id": customer_id},
            fetch="one",
        )
