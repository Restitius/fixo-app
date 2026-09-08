"""ProviderMatchingRepository port — matching engine interaction (Provider Req Phase 12).

The provider-side window into the marketplace matching engine: the
eligibility signals the engine weighs (rating, jobs, verification, service
approval, price, areas, availability, response rate) and the match insights
(score/rank/strategy/reasons per matched request). Read-only; the engine
itself remains in app/domains/matching.
"""
from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Any


class ProviderMatchingRepository(ABC):
    """Persistence boundary for the provider's match interaction reads."""

    @abstractmethod
    async def eligibility(self, provider_id: str) -> Any | None:
        """How the matching engine sees the provider's signals today."""

    @abstractmethod
    async def insights(self, provider_id: str) -> list[dict[str, Any]]:
        """This provider's match history with score/rank/reasons + outcomes."""

    @abstractmethod
    async def summary(self, provider_id: str) -> Any | None:
        """Match-opportunity counts (pending vs quoted vs accepted vs selected)."""