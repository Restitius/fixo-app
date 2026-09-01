"""CreateUserDTO — internal transport for User creation input (section 24)."""
from __future__ import annotations

from dataclasses import dataclass, field
from datetime import date
from decimal import Decimal

from app.shared.dtos.base import BaseDTO


@dataclass
class CreateUserDTO(BaseDTO):
    """creation input DTO moving between controller and service."""

    user_id: str
    name: str
    notes: str | None = None
