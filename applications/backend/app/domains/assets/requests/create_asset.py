"""CreateAsset creation — HTTP input validation schema."""
from __future__ import annotations

from datetime import date
from decimal import Decimal

from pydantic import Field, field_validator

from app.domains.assets.requests.asset_types import normalize_asset_type
from app.shared.schemas.base import BaseSchema


class CreateAssetRequest(BaseSchema):
    """CreateAsset creation payload (camelCase over the wire)."""

    name: str = Field(min_length=1, max_length=120)
    asset_type: str = "other"
    property_id: str | None = None
    brand: str | None = Field(default=None, max_length=80)
    serial_number: str | None = Field(default=None, max_length=80)
    purchase_value: Decimal = Field(default=Decimal("0"), ge=0)
    currency: str = "TZS"
    purchased_at: date | None = None
    warranty_until: date | None = None
    notes: str | None = None

    @field_validator("asset_type")
    @classmethod
    def _asset_type(cls, value: str) -> str:
        return normalize_asset_type(value) or "other"
