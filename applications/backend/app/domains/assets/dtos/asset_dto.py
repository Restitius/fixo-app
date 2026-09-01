"""AssetDTO — internal transport for Asset existing asset (section 24)."""
from __future__ import annotations

from dataclasses import dataclass, field
from datetime import date
from decimal import Decimal

from app.shared.dtos.base import BaseDTO


@dataclass
class AssetDTO(BaseDTO):
    """existing asset DTO moving between controller and service."""

    asset_id: int
    user_id: str
    asset_code: str
    name: str
    asset_type: str
    status: str
    purchase_value: Decimal
    current_value: Decimal
    currency: str
    purchased_at: date | None = None
    notes: str | None = None
