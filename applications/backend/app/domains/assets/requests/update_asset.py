"""UpdateAsset update — HTTP input validation schema."""
from __future__ import annotations

from datetime import date

from app.shared.schemas.base import BaseSchema


class UpdateAssetRequest(BaseSchema):
    """UpdateAsset update payload (camelCase over the wire)."""

    name: str | None = None
    asset_type: str | None = None
    purchased_at: date | None = None
    notes: str | None = None
