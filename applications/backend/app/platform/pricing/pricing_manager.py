"""PricingManager — pricing rules engine facade."""
from __future__ import annotations

from typing import Any

from app.platform.pricing.pricing_engine import PricingEngine


class PricingManager:
    """Compute/quote prices through the registered pricing pipeline (scaffold)."""

    def __init__(self, engine: PricingEngine) -> None:
        self._engine = engine

    @property
    def engine(self) -> PricingEngine:
        return self._engine

    async def compute(self, *, context: dict[str, Any]) -> Any:
        """Compute a price snapshot (rules -> calculators -> snapshot)."""
        raise NotImplementedError("PricingManager.compute — wire pricing engine")