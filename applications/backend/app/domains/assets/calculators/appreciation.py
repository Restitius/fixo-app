"""Appreciation calculators (pure math)."""
from __future__ import annotations

from decimal import Decimal


def compound_growth(present_value: Decimal, annual_rate: Decimal, periods: int) -> Decimal:
    """Future value under compound growth."""
    factor = (Decimal(1) + Decimal(annual_rate)) ** int(periods)
    return (Decimal(present_value) * factor).quantize(Decimal("0.01"))


def cagr(begin: Decimal, end: Decimal, years: int) -> Decimal:
    """Compound annual growth rate between two valuations."""
    if Decimal(begin) <= 0 or years <= 0:
        raise ValueError("begin must be positive and years >= 1")
    ratio = Decimal(end) / Decimal(begin)
    return (ratio ** (Decimal(1) / Decimal(years)) - Decimal(1)).quantize(Decimal("0.0001"))
