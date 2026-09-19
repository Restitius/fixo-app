"""Depreciation calculators (pure math — no IO)."""
from __future__ import annotations

from decimal import Decimal


def straight_line(cost: Decimal, salvage: Decimal, life_years: int) -> Decimal:
    """Annual straight-line depreciation expense."""
    if life_years <= 0:
        raise ValueError("life_years must be positive")
    return (Decimal(cost) - Decimal(salvage)) / Decimal(life_years)


def declining_balance_schedule(cost: Decimal, rate: Decimal, years: int) -> list[Decimal]:
    """Year-by-year declining-balance book values."""
    if not (Decimal(0) < Decimal(rate) < Decimal(1)):
        raise ValueError("rate must be between 0 and 1")
    values: list[Decimal] = []
    book = Decimal(cost)
    for _ in range(int(years)):
        book = book * (Decimal(1) - Decimal(rate))
        values.append(book.quantize(Decimal("0.01")))
    return values
