"""PricingGateway — pricing computation capability for quotes/bookings."""
from __future__ import annotations

from typing import Any, Protocol, runtime_checkable


@runtime_checkable
class PricingGateway(Protocol):
    """Compute a price snapshot for a service quote/booking."""

    async def price(self, context: dict[str, Any]) -> dict[str, Any]: ...