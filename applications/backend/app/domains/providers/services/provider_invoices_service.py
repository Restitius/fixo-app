"""ProviderInvoicesService — provider invoices & statements (Requirement Phase 32).

Exposes provider-facing invoice management: list invoices (paginated, newest
period first), fetch a single invoice by id (ownership-scoped), and return
a totals summary (gross, commission, tax, net, overdue count).

Invoice statuses: issued, paid, overdue, void.

No generation or delivery happens in this phase — listing and reading only.
"""

from typing import Any

from app.shared.exceptions.hierarchy import NotFoundError, ValidationError

# -- pagination defaults ----------------------------------------------------------
DEFAULT_LIMIT = 50
MAX_LIMIT = 100


class ProviderInvoicesService:
    """Domain service for provider invoice read operations."""

    def __init__(self, invoices: Any) -> None:
        self._invoices = invoices

    # -- invoices -------------------------------------------------------------------

    async def list_invoices(
        self, provider_id: str, *, limit: int = DEFAULT_LIMIT, offset: int = 0
    ) -> dict[str, Any]:
        """List provider invoices, newest period first.

        Returns a structured dict with invoices list and pagination metadata.
        """
        if limit < 1 or limit > MAX_LIMIT:
            raise ValidationError(f"limit must be between 1 and {MAX_LIMIT}")
        if offset < 0:
            raise ValidationError("offset must be >= 0")
        rows = await self._invoices.list(provider_id, limit=limit, offset=offset)
        return {
            "invoices": [self._encode_invoice(r) for r in rows],
            "limit": limit,
            "offset": offset,
        }

    async def get_invoice(self, provider_id: str, *, invoice_id: str) -> dict[str, Any]:
        """Fetch a single invoice by id (ownership-checked).

        Raises NotFoundError when the invoice does not exist or is not owned by
        the requesting provider.
        """
        row = await self._invoices.get(provider_id, invoice_id=invoice_id)
        if row is None:
            raise NotFoundError("Invoice not found")
        return self._encode_invoice(row)

    async def get_summary(self, provider_id: str) -> dict[str, Any]:
        """Return provider invoice totals and overdue count."""
        row = await self._invoices.summary(provider_id)
        if row is None:
            return {
                "total_count": 0,
                "total_gross": 0,
                "total_commission": 0,
                "total_tax": 0,
                "total_net": 0,
                "overdue_count": 0,
            }
        return self._encode_summary(row)

    # -- encoding helpers -----------------------------------------------------------

    @staticmethod
    def _encode_invoice(row: dict[str, Any]) -> dict[str, Any]:
        """Shape an invoice row for API output."""
        return {
            "id": str(row.get("id") or ""),
            "invoice_number": str(row.get("invoice_number") or ""),
            "period_start": str(row.get("period_start") or ""),
            "period_end": str(row.get("period_end") or ""),
            "gross_amount": float(row.get("gross_amount") or 0),
            "commission_amount": float(row.get("commission_amount") or 0),
            "tax_amount": float(row.get("tax_amount") or 0),
            "net_amount": float(row.get("net_amount") or 0),
            "currency": str(row.get("currency") or "USD"),
            "status": str(row.get("status") or "issued"),
            "issued_at": row.get("issued_at"),
            "due_at": row.get("due_at"),
            "paid_at": row.get("paid_at"),
        }

    @staticmethod
    def _encode_summary(row: dict[str, Any]) -> dict[str, Any]:
        """Shape an invoice summary row for API output."""
        return {
            "total_count": int(row.get("total_count") or 0),
            "total_gross": float(row.get("total_gross") or 0),
            "total_commission": float(row.get("total_commission") or 0),
            "total_tax": float(row.get("total_tax") or 0),
            "total_net": float(row.get("total_net") or 0),
            "overdue_count": int(row.get("overdue_count") or 0),
        }