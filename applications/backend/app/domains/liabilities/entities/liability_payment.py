"""LiabilityPayment entity — A single repayment against a liability."""
from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class LiabilityPayment:
    parent_id: int
    label: str
