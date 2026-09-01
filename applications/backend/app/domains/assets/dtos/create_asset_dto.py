"""CreateAssetDTO — internal transport for CreateAsset creation input (section 24)."""
from __future__ import annotations

from dataclasses import dataclass, field
from datetime import date
from decimal import Decimal

from app.shared.dtos.base import BaseDTO


@dataclass
class CreateAssetDTO(BaseDTO):
    """creation input DTO moving between controller and service."""

    user_id: str
    name: str
    asset_type: str = "OTHER"
    purchase_value: Decimal = Decimal("0")
    currency: str = "USD"
    purchased_at: date | None = None
    notes: str | None = None
