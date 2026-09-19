"""UpdateAssetDTO — internal transport for UpdateAsset update input (section 24)."""
from __future__ import annotations

from dataclasses import dataclass
from datetime import date

from app.shared.dtos.base import BaseDTO


@dataclass
class UpdateAssetDTO(BaseDTO):
    """update input DTO moving between controller and service."""

    asset_id: str
    user_id: str
    name: str | None = None
    asset_type: str | None = None
    purchased_at: date | None = None
    notes: str | None = None
