"""UserFilterDTO — internal transport for User listing filters (section 24)."""
from __future__ import annotations

from dataclasses import dataclass, field
from datetime import date
from decimal import Decimal

from app.shared.dtos.base import BaseDTO


@dataclass
class UserFilterDTO(BaseDTO):
    """listing filters DTO moving between controller and service."""

    user_id: str
    page: int = 1
    size: int = 20
    status: str | None = None
    search: str | None = None
