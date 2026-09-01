"""Asset business rules (pure predicates — enforce BEFORE persistence)."""
from __future__ import annotations

from decimal import Decimal


def cannot_sell_twice(status: str) -> bool:
    """True when selling is FORBIDDEN (already sold/archived)."""
    return status in {"SOLD", "ARCHIVED"}


def value_must_be_positive(amount: Decimal | str) -> bool:
    """Values must be strictly positive."""
    return Decimal(str(amount)) > 0


def archive_requires_not_sold(status: str) -> bool:
    """Sold assets are historical records; archiving is forbidden."""
    return status != "SOLD"
