"""Refund math - pure domain, no I/O."""
from __future__ import annotations


class RefundPolicyEngine:
    """Refund = whatever was authorized beyond the cancellation fee, never negative."""

    def compute(
        self,
        agreed_amount: float,
        fee: float,
        authorized_amount: float | None = None,
    ) -> float:
        base = float(authorized_amount) if authorized_amount is not None else float(agreed_amount or 0)
        return round(max(base - float(fee or 0), 0.0), 2)
