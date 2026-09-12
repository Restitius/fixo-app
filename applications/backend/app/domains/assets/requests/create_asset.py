"""CreateAsset creation — HTTP input validation schema."""
from __future__ import annotations

from decimal import Decimal
from datetime import date

from app.shared.schemas.base import BaseSchema


class CreateAssetRequest(BaseSchema):
    """CreateAsset creation payload (camelCase over the wire)."""

    name: str
    asset_type: str = "OTHER"
    property_id: str | None = None
    purchase_value: Decimal = Decimal("0")
    currency: str = "USD"
    purchased_at: date | None = None
    notes: str | None = None
