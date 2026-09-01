"""Liability business rules (pure predicates — enforce BEFORE persistence)."""
from __future__ import annotations

def approved_cannot_be_deleted_directly(status: str) -> bool:
    """Active liabilities must be settled/archived through the workflow."""
    return status == "ACTIVE"


def rate_within_bounds(rate) -> bool:
    """Interest rate must be between 0 and 100 percent."""
    from decimal import Decimal
    return Decimal(0) <= Decimal(str(rate)) <= Decimal(100)
