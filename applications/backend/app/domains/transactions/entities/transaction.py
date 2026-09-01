"""Transaction entity — Rich domain object (not a database model). (section 27)."""
from __future__ import annotations

from dataclasses import dataclass


@dataclass
class Transaction:
    transaction_id: int | None
    user_id: str
    status: str
    notes: str | None = None
