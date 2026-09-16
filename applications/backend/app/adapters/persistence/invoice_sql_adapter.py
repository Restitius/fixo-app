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

    async def finalize(
        self, customer_id: str, booking_id: str, tax_rate: float | None = None
    ) -> dict[str, Any] | None:
        return await self._sql.execute(
            InvoiceQueryIds.INVOICE_FINALIZE,
            {"booking_id": booking_id, "customer_id": customer_id, "tax_rate": tax_rate},
            fetch="one",
        )

    async def issue(self, customer_id: str, invoice_id: str) -> dict[str, Any] | None:
        return await self._sql.execute(
            InvoiceQueryIds.INVOICE_ISSUE,
            {"invoice_id": invoice_id, "customer_id": customer_id},
            fetch="one",
        )

    async def get_by_booking(self, customer_id: str, booking_id: str) -> dict[str, Any] | None:
        return await self._sql.execute(
            InvoiceQueryIds.INVOICE_GET_BY_BOOKING,
            {"booking_id": booking_id, "customer_id": customer_id},
            fetch="one",
        )

    async def get_owned(self, customer_id: str, invoice_id: str) -> dict[str, Any] | None:
        return await self._sql.execute(
            InvoiceQueryIds.INVOICE_GET_OWNED,
            {"invoice_id": invoice_id, "customer_id": customer_id},
            fetch="one",
        )

    async def list(self, customer_id: str, *, limit: int = 20, offset: int = 0) -> list[dict[str, Any]]:
        rows = await self._sql.execute(
            InvoiceQueryIds.INVOICE_LIST,
            {"customer_id": customer_id, "limit": limit, "offset": offset},
            fetch="all",
        )
        return list(rows or [])

    async def mark_paid(self, customer_id: str, invoice_id: str) -> dict[str, Any] | None:
        return await self._sql.execute(
            InvoiceQueryIds.INVOICE_MARK_PAID,
            {"invoice_id": invoice_id, "customer_id": customer_id},
            fetch="one",
        )
