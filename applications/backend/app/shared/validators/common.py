"""Reusable pure validators — raise ValueError with clear messages."""
from __future__ import annotations

import re
from decimal import Decimal, InvalidOperation

_CURRENCY_RE = re.compile(r"^[A-Z]{3}$")


def validate_currency(code: str) -> str:
    """ISO-4217 style alpha-3 currency code."""
    if not _CURRENCY_RE.match(code or ""):
        raise ValueError(f"Invalid currency code: {code!r}")
    return code


def validate_positive_amount(value: Decimal | float | int | str) -> Decimal:
    """Coerce to Decimal and require > 0 (e.g. asset values, amounts)."""
    try:
        amount = Decimal(str(value))
    except InvalidOperation as exc:
        raise ValueError(f"Not a valid amount: {value!r}") from exc
    if amount <= 0:
        raise ValueError(f"Amount must be positive, got {amount}")
    return amount


def validate_non_empty(value: str, label: str = "value") -> str:
    if not value or not value.strip():
        raise ValueError(f"{label} must not be empty")
    return value.strip()


def clamp_page(page: int, size: int, *, max_size: int = 100) -> tuple[int, int]:
    return max(1, int(page)), min(max(1, int(size)), max_size)
