"""Money value object — amount + currency with precision guarantees (section 28)."""
from __future__ import annotations

from dataclasses import dataclass
from decimal import Decimal, InvalidOperation

from app.shared.validators.common import validate_currency


@dataclass(frozen=True)
class Money:
    """Immutable monetary amount; arithmetic enforces same-currency."""

    amount: Decimal
    currency: str

    def __post_init__(self) -> None:
        validate_currency(self.currency)
        try:
            object.__setattr__(self, "amount", Decimal(self.amount))
        except (InvalidOperation, TypeError) as exc:
            raise ValueError(f"Invalid money amount: {self.amount!r}") from exc

    def add(self, other: "Money") -> "Money":
        if self.currency != other.currency:
            raise ValueError(f"Currency mismatch: {self.currency} vs {other.currency}")
        return Money(self.amount + other.amount, self.currency)

    def subtract(self, other: "Money") -> "Money":
        if self.currency != other.currency:
            raise ValueError(f"Currency mismatch: {self.currency} vs {other.currency}")
        return Money(self.amount - other.amount, self.currency)

    def is_positive(self) -> bool:
        return self.amount > 0
