"""Valuation rules (pure predicates)."""
from __future__ import annotations

from decimal import Decimal


def revalue_requires_active(status: str) -> bool:
    """Only ACTIVE assets accept new valuations."""
    return status == "ACTIVE"


def new_value_positive(new_value: Decimal | str) -> bool:
    return Decimal(str(new_value)) > 0


def movement_within_tolerance(old: Decimal, new: Decimal, tolerance_pct: Decimal) -> bool:
    """Flags implausible jumps beyond tolerance (fraud/data-quality guard)."""
    if Decimal(old) == 0:
        return True
    change = abs(Decimal(new) - Decimal(old)) / abs(Decimal(old))
    return change <= Decimal(tolerance_pct)
