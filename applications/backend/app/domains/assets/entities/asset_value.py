"""AssetValuePoint — one historical valuation observation."""
from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from decimal import Decimal


@dataclass(frozen=True)
class AssetValuePoint:
    asset_id: int
    value: Decimal
    currency: str
    valued_at: datetime
    source: str = "manual"  # manual | market_feed | scheduled_job
