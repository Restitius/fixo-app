"""UpdateAsset update — HTTP input validation schema."""
from __future__ import annotations

from datetime import date

from pydantic import Field, field_validator

from app.domains.assets.requests.asset_types import normalize_asset_type
from app.shared.schemas.base import BaseSchema


class UpdateAssetRequest(BaseSchema):
    """UpdateAsset update payload (camelCase over the wire)."""

    name: str | None = Field(default=None, min_length=1, max_length=120)
    asset_type: str | None = None
    brand: str | None = Field(default=None, max_length=80)
    serial_number: str | None = Field(default=None, max_length=80)
    purchased_at: date | None = None
    warranty_until: date | None = None
    notes: str | None = None

    @field_validator("asset_type")
    @classmethod
    def _asset_type(cls, value: str | None) -> str | None:
        return normalize_asset_type(value)
