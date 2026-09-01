"""LiabilityDTO — internal transport for Liability existing liability (section 24)."""
from __future__ import annotations

from dataclasses import dataclass, field
from datetime import date
from decimal import Decimal

from app.shared.dtos.base import BaseDTO


@dataclass
class LiabilityDTO(BaseDTO):
    """existing liability DTO moving between controller and service."""

    liability_id: int
    user_id: str
    status: str
    notes: str | None = None
