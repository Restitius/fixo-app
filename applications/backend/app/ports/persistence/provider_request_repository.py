"""ProviderRequestRepository port — incoming job requests (Provider Req Phase 11).

The domain owns the feed/response rules; the adapter is the only code that
knows the PRV.REQUESTS.* query ids. The feed reads the marketplace matching
candidates; responses land in PROVIDER_REQUEST_RESPONSES; quotes go to the
existing QUOTATIONS table.
"""
from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Any


class ProviderRequestRepository(ABC):
    """Persistence boundary for the provider's incoming request workflow."""

    @abstractmethod
    async def feed(self, provider_id: str) -> list[dict[str, Any]]:
        """Matched requests awaiting this provider's response, full context."""

    @abstractmethod
    async def get(self, provider_id: str, request_id: str) -> Any | None:
        """One feed item's detail, or None when not in this provider's feed."""

    @abstractmethod
    async def respond(
        self, provider_id: str, request_id: str, data: dict[str, Any]
    ) -> Any | None:
        """Record a response row; None when the guard rejects (not in feed /
        already terminal)."""

    @abstractmethod
    async def responses_list(self, provider_id: str) -> list[dict[str, Any]]:
        """This provider's response ledger (most recent first)."""

    @abstractmethod
    async def submit_quote(
        self, provider_id: str, request_id: str, data: dict[str, Any]
    ) -> Any | None:
        """Insert a QUOTATIONS row; None when the guard rejects."""

    @abstractmethod
    async def quotes_list(self, provider_id: str) -> list[dict[str, Any]]:
        """This provider's submitted quotes (most recent first)."""