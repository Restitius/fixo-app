"""Asset entity — domain object, NOT a database model (section 27)."""
from __future__ import annotations

from dataclasses import dataclass, field
from datetime import date
from decimal import Decimal


@dataclass
class Asset:
    """Rich domain object for an owned asset."""

    asset_id: int | None
    user_id: str
    asset_code: str
    name: str
    asset_type: str
    status: str
    purchase_value: Decimal
    current_value: Decimal
    currency: str
    purchased_at: date | None = None
    notes: str | None = None
    history: list["AssetValuePoint"] = field(default_factory=list)

    def is_sellable(self) -> bool:
        """Business shorthand used by policies/rules."""
        return self.status == "ACTIVE"

    def unrealized_gain(self) -> Decimal:
        """Current minus purchase value (pure)."""
        return self.current_value - self.purchase_value
