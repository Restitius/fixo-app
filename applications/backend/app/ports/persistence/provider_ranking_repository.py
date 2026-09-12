"""ProviderRankingRepository — provider ranking & reputation (Requirement Phase 35).

A provider's ranking is derived from their performance KPIs and customer
retention signals: completion rate, on-time rate, average rating, recurring
customers, and referrals. The rank level (bronze/silver/gold/platinum)
is computed from the rank score.

The repository exposes:
- get: current ranking signals for one provider (provider-owned lookup)
- leaderboard: top providers by rank score (public visibility)
"""

from abc import abstractmethod
from typing import Any, Protocol


class ProviderRankingRepository(Protocol):
    @abstractmethod
    async def get(self, provider_id: str) -> Any | None: ...

    @abstractmethod
    async def leaderboard(self, *, limit: int = 20, offset: int = 0) -> list[Any]: ...