"""Liability workflow/state-transition rules (pure predicates)."""
from __future__ import annotations

def archive_requires_zero_balance(outstanding) -> bool:
    """Only fully repaid liabilities may be archived."""
    from decimal import Decimal
    return Decimal(str(outstanding)) <= 0


def term_months_positive(term_months: int) -> bool:
    """Repayment term must be at least one month."""
    return int(term_months) >= 1
