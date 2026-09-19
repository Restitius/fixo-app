"""ProviderDashboardRepository port — read aggregation (Provider Req Phase 10).

The dashboard owns no tables of its own: the adapter is the only code that
knows the PRV.DASH.* query ids, each a governed read over the tables built
by Phases 1-9 plus the marketplace core (bookings, invoices, requests).
"""
from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Any


class ProviderDashboardRepository(ABC):
    """Persistence boundary for provider dashboard aggregations."""

    @abstractmethod
    async def stats(self, provider_id: str) -> Any | None:
        """The four primary statistics (jobs, requests, earnings pointer, rating)."""

    @abstractmethod
    async def setup(self, provider_id: str) -> Any | None:
        """Account setup state feeding the attention list."""

    @abstractmethod
    async def earnings(self, provider_id: str) -> Any | None:
        """Collected/billed earnings snapshot for today/week/month."""

    @abstractmethod
    async def performance(self, provider_id: str) -> Any | None:
        """Rates derived from the provider's booking history."""

    @abstractmethod
    async def upcoming(self, provider_id: str) -> list[dict[str, Any]]:
        """Today's schedule and the next 7 days of bookings."""