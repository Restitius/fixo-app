"""ProviderEarningsService — earnings module (Requirement Phase 28).

Main statistics:
  - available balance  (PAID invoices)
  - pending earnings   (DRAFT/ISSUED invoices that are not yet paid)
  - total earnings     (all booked/received income)
  - withdrawn amount   (0 until Provider Payouts, Phase 30)

Views: today / this week / this month / this year — computed from the
invoice paid_at windows (summarised in SQL).

The provider can see every transaction (invoice ledger, newest first).
"""
from __future__ import annotations

from typing import Any

from app.shared.exceptions.hierarchy import ValidationError


class ProviderEarningsService:
    """Domain service for provider earnings."""

    def __init__(self, earnings: Any) -> None:
        self._earnings = earnings

    # -- summary -------------------------------------------------------------

    async def summary(self, provider_id: str) -> dict[str, Any]:
        row = await self._earnings.summary(provider_id)
        if not row:
            # No invoice rows yet — all statistics are zero.
            row = {
                "pending_earnings": 0,
                "available_balance": 0,
                "total_earnings": 0,
                "withdrawn_amount": 0,
                "earned_today": 0,
                "earned_week": 0,
                "earned_month": 0,
                "earned_year": 0,
                "currency": "TZS",
            }
        return {
            "pending_earnings": float(row.get("pending_earnings") or 0),
            "available_balance": float(row.get("available_balance") or 0),
            "total_earnings": float(row.get("total_earnings") or 0),
            "withdrawn_amount": float(row.get("withdrawn_amount") or 0),
            "views": {
                "today": float(row.get("earned_today") or 0),
                "this_week": float(row.get("earned_week") or 0),
                "this_month": float(row.get("earned_month") or 0),
                "this_year": float(row.get("earned_year") or 0),
            },
            "currency": str(row.get("currency") or "TZS"),
        }

    # -- transactions ----------------------------------------------------------

    async def transactions(
        self, provider_id: str, *, limit: int = 20, offset: int = 0
    ) -> dict[str, Any]:
        if limit < 1 or limit > 100:
            raise ValidationError("limit must be between 1 and 100")
        if offset < 0:
            raise ValidationError("offset must be >= 0")
        rows = await self._earnings.transactions(
            provider_id, limit=limit, offset=offset
        )
        return {
            "transactions": [self._encode_tx(t) for t in rows],
            "limit": limit,
            "offset": offset,
        }

    # -- helpers ---------------------------------------------------------------

    @staticmethod
    def _encode_tx(row: dict[str, Any]) -> dict[str, Any]:
        return {
            "invoice_id": str(row.get("invoice_id") or ""),
            "invoice_number": str(row.get("invoice_number") or ""),
            "booking_id": str(row.get("booking_id") or ""),
            "booking_number": str(row.get("booking_number") or ""),
            "customer_name": str(row.get("customer_name") or ""),
            "service_name": str(row.get("service_name") or ""),
            "amount": float(row.get("total_amount") or 0),
            "currency": str(row.get("currency") or "TZS"),
            "status": str(row.get("status") or ""),
            "issued_at": str(row.get("issued_at") or ""),
            "paid_at": str(row.get("paid_at") or ""),
            "created_at": str(row.get("created_at") or ""),
        }