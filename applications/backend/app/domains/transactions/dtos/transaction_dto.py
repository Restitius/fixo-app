"""TransactionDTO — internal transport for Transaction existing transaction (section 24)."""
from __future__ import annotations

from dataclasses import dataclass

from app.shared.dtos.base import BaseDTO


@dataclass
class TransactionDTO(BaseDTO):
    """existing transaction DTO moving between controller and service."""

    transaction_id: int
    user_id: str
    status: str
    notes: str | None = None
