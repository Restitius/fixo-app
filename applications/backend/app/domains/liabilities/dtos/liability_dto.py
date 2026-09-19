"""LiabilityDTO — internal transport for Liability existing liability (section 24)."""
from __future__ import annotations

from dataclasses import dataclass

from app.shared.dtos.base import BaseDTO


@dataclass
class LiabilityDTO(BaseDTO):
    """existing liability DTO moving between controller and service."""

    liability_id: int
    user_id: str
    status: str
    notes: str | None = None
