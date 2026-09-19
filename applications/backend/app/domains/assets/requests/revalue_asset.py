"""RevalueAsset revaluation — HTTP input validation schema."""
from __future__ import annotations

from decimal import Decimal

from app.shared.schemas.base import BaseSchema


class RevalueAssetRequest(BaseSchema):
    """RevalueAsset revaluation payload (camelCase over the wire)."""

    new_value: Decimal
    reason: str | None = None
