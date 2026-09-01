"""UserDTO — internal transport for User existing user (section 24)."""
from __future__ import annotations

from dataclasses import dataclass, field
from datetime import date
from decimal import Decimal

from app.shared.dtos.base import BaseDTO


@dataclass
class UserDTO(BaseDTO):
    """existing user DTO moving between controller and service."""

    user_id: int
    user_id: str
    status: str
    notes: str | None = None
