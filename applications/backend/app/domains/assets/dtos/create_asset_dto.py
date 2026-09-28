"""CreateAssetDTO — internal transport for CreateAsset creation input (section 24)."""
from __future__ import annotations

from dataclasses import dataclass
from datetime import date
from decimal import Decimal

from app.shared.dtos.base import BaseDTO


@dataclass
class CreateAssetDTO(BaseDTO):
    """creation input DTO moving between controller and service."""

    user_id: str
    name: str
    asset_type: str = "other"
    property_id: str | None = None
    brand: str | None = None
    serial_number: str | None = None
    purchase_value: Decimal = Decimal("0")
    currency: str = "TZS"
    purchased_at: date | None = None
    warranty_until: date | None = None
    notes: str | None = None
