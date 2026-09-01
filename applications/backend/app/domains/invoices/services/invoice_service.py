"""InvoiceService — Module 27: invoice & receipt lifecycle.

Invoice is the family snapshot: finalized at completion, issued, then
marked PAID once funds capture. Owned reads; no cross-domain writes.
"""
from __future__ import annotations

import logging
from typing import Any

from app.shared.exceptions.hierarchy import NotFoundError, ValidationError

logger = logging.getLogger(__name__)


class InvoiceService:
    def __init__(
        self,
        invoices: Any,      # InvoiceRepository port
        bookings: Any,      # BookingRepository port
        workflows: Any,     # WorkflowManager (injected)
        notifications: Any | None = None,
    ) -> None:
        self._invoices = invoices
        self._bookings = bookings
        self._workflows = workflows
        self._notifications = notifications

    async def finalize(self, customer_id: str, booking_id: str) -> dict[str, Any]:
        """Create the DRAFT invoice snapshot for a completed job."""
        booking = await self._bookings.get(customer_id, booking_id)
        if booking["status"] != "CUSTOMER_CONFIRMED":
            raise ValidationError(
                f"Invoice requires CUSTOMER_CONFIRMED (current: {booking['status']})"
            )
        row = await self._invoices.finalize(customer_id, booking_id)
        if not row:
            raise ValidationError("Could not finalize the invoice")
        return row

    async def issue(self, customer_id: str, invoice_id: str) -> dict[str, Any]:
        invoice = await self.get(customer_id, invoice_id)
        if invoice["status"] != "DRAFT":
            raise ValidationError(
                f"Only DRAFT invoices can be issued (current: {invoice['status']})"
            )
        row = await self._invoices.issue(customer_id, invoice_id)
        if not row:
            raise ValidationError("Could not issue the invoice")
        if self._notifications is not None:
            await self._notifications.notify(
                customer_id, ntype="INVOICE.ISSUED",
                title=f"Invoice {invoice['invoice_number']}",
                body=f"{invoice['total_amount']} {invoice['currency']} due.",
                ref_type="INVOICE", ref_id=invoice_id,
            )
        return row

    async def mark_paid(self, customer_id: str, invoice_id: str) -> dict[str, Any]:
        invoice = await self.get(customer_id, invoice_id)
        if invoice["status"] != "ISSUED":
            raise ValidationError(
                f"Only ISSUED invoices can be paid (current: {invoice['status']})"
            )
        row = await self._invoices.mark_paid(customer_id, invoice_id)
        if not row:
            raise ValidationError("Could not mark the invoice paid")
        return {**row, "items": invoice.get("items", [])}

    async def get(self, customer_id: str, invoice_id: str) -> dict[str, Any]:
        row = await self._invoices.get_owned(customer_id, invoice_id)
        if not row:
            raise NotFoundError("Invoice not found")
        return row

    async def list(self, customer_id: str, *, limit: int = 20, offset: int = 0):
        return await self._invoices.list(customer_id, limit=limit, offset=offset)