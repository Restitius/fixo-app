"""AssetFilterDTO — internal transport for AssetFilter listing filters (section 24)."""
from __future__ import annotations

from dataclasses import dataclass

from app.shared.dtos.base import BaseDTO


@dataclass
class AssetFilterDTO(BaseDTO):
    """listing filters DTO moving between controller and service."""

    user_id: str
    page: int = 1
    size: int = 20
    status: str | None = None
    asset_type: str | None = None
    search: str | None = None
    sort_by: str = "created_at"
    sort_dir: str = "desc"
