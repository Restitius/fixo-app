"""TransactionLine entity — One leg of a split transaction."""
from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class TransactionLine:
    parent_id: int
    label: str
