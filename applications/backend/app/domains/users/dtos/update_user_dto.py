"""UpdateUserDTO — internal transport for User update input (section 24)."""
from __future__ import annotations

from dataclasses import dataclass, field
from datetime import date
from decimal import Decimal

from app.shared.dtos.base import BaseDTO


@dataclass
class UpdateUserDTO(BaseDTO):
    """update input DTO moving between controller and service."""

    user_id: int
    user_id: str
    notes: str | None = None
