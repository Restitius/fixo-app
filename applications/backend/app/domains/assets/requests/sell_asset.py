"""SellAsset sale — HTTP input validation schema."""
from __future__ import annotations

from decimal import Decimal
from datetime import date

from app.shared.schemas.base import BaseSchema


class SellAssetRequest(BaseSchema):
    """SellAsset sale payload (camelCase over the wire)."""

    sale_value: Decimal
    currency: str = "USD"
    sold_at: date | None = None
    counterparty: str | None = None
