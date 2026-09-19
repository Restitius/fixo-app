"""ProviderServicePricingRepository port — structured pricing (Provider Req Phase 7).

The domain owns the pricing rules; the adapter is the only code that knows the
PRV.PRICING.* query ids. Pricing is keyed (provider_id, service_id) and the
database FK guarantees the service is configured first.
"""
from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Any


class ProviderServicePricingRepository(ABC):
    """Persistence boundary for per-service pricing structures."""

    @abstractmethod
    async def list_pricing(self, provider_id: str) -> list[dict[str, Any]]:
        """All structured pricing rows for the provider's configured services."""

    @abstractmethod
    async def get_pricing(self, provider_id: str, service_id: str) -> Any | None:
        """One service's structured pricing row, or None."""

    @abstractmethod
    async def upsert_pricing(
        self, provider_id: str, service_id: str, data: dict[str, Any]
    ) -> Any | None:
        """Full replace of one service's pricing; returns the row plus the
        re-synced parent configuration's coarse pricing columns."""

    @abstractmethod
    async def clear_pricing(self, provider_id: str, service_id: str) -> Any | None:
        """Remove one service's pricing and reset the parent configuration;
        returns the reset configuration row, or None when nothing existed."""
