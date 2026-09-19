"""Transaction business rules (pure predicates — enforce BEFORE persistence)."""
from __future__ import annotations


def settled_transactions_are_immutable(status: str) -> bool:
    """SETTLED rows can never be edited or archived."""
    return status == "SETTLED"


def amount_must_be_positive(amount) -> bool:
    """Every transaction amount must be strictly positive."""
    from decimal import Decimal
    return Decimal(str(amount)) > 0
