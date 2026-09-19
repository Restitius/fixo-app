"""ProviderWalletService — provider wallet (Requirement Phase 29).

The provider wallet shows:

  - available balance   (earning funds available to withdraw)
  - pending balance     (earned but not yet settled)
  - reserved funds      (held against an active dispute/refund)
  - withdrawals         (total of WITHDRAWAL ledger entries)
  - refund deductions   (total of REFUND_DEDUCTION entries)
  - bonuses             (total of BONUS entries)
  - adjustments         (total of ADJUSTMENT entries)

Example transaction behind it:

  Booking #FX12390
    Customer paid:       TZS 120,000
    Platform commission: TZS  12,000
    Provider earnings:   TZS 108,000

This phase ships the read surface (summary + full transaction history).
Writing EARNING/COMMISSION/WITHDRAWAL/... ledger entries arrives with
Phase 30 payout processing.
"""
from __future__ import annotations

from typing import Any

from app.shared.exceptions.hierarchy import ValidationError


class ProviderWalletService:
    """Domain service for the provider wallet."""

    def __init__(self, wallet: Any) -> None:
        self._wallet = wallet

    # -- wallet overview -------------------------------------------------------

    async def overview(self, provider_id: str) -> dict[str, Any]:
        await self._wallet.get_or_create(provider_id)
        row = await self._wallet.summary(provider_id)
        if not row:
            row = {
                "available_balance": 0,
                "pending_balance": 0,
                "reserved_funds": 0,
                "currency": "TZS",
                "withdrawals": 0,
                "refund_deductions": 0,
                "bonuses": 0,
                "adjustments": 0,
            }
        return {
            "available_balance": float(row.get("available_balance") or 0),
            "pending_balance": float(row.get("pending_balance") or 0),
            "reserved_funds": float(row.get("reserved_funds") or 0),
            "withdrawals": float(row.get("withdrawals") or 0),
            "refund_deductions": float(row.get("refund_deductions") or 0),
            "bonuses": float(row.get("bonuses") or 0),
            "adjustments": float(row.get("adjustments") or 0),
            "currency": str(row.get("currency") or "TZS"),
        }

    # -- transaction history ---------------------------------------------------

    async def transactions(
        self, provider_id: str, *, limit: int = 20, offset: int = 0
    ) -> dict[str, Any]:
        if limit < 1 or limit > 100:
            raise ValidationError("limit must be between 1 and 100")
        if offset < 0:
            raise ValidationError("offset must be >= 0")
        await self._wallet.get_or_create(provider_id)
        rows = await self._wallet.ledger(provider_id, limit=limit, offset=offset)
        return {
            "transactions": [self._encode_tx(t) for t in rows],
            "limit": limit,
            "offset": offset,
        }

    # -- helpers ------------------------------------------------------------------

    @staticmethod
    def _encode_tx(row: dict[str, Any]) -> dict[str, Any]:
        return {
            "entry_id": str(row.get("entry_id") or ""),
            "entry_type": str(row.get("entry_type") or ""),
            "amount": float(row.get("amount") or 0),
            "running_balance": float(row.get("running_balance") or 0),
            "currency": str(row.get("currency") or "TZS"),
            "reference_type": row.get("reference_type"),
            "reference_id": (
                str(row["reference_id"]) if row.get("reference_id") else None
            ),
            "booking_number": row.get("booking_number"),
            "description": row.get("description"),
            "created_at": str(row.get("created_at") or ""),
        }