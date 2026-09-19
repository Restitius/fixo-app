"""ProviderQuotationRepository port — professional quotations (Provider Req Phase 13).

The domain owns the quotation rules; the adapter is the only code that knows
the PRV.QUOTE.* query ids. Builds on the marketplace QUOTATIONS row with a
professional breakdown; statuses follow Draft → Submitted → Viewed →
Accepted/Rejected/Expired/Withdrawn.
"""
from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Any


class ProviderQuotationRepository(ABC):
    """Persistence boundary for provider professional quotations."""

    @abstractmethod
    async def save(
        self, provider_id: str, request_id: str, data: dict[str, Any]
    ) -> Any | None:
        """Create a DRAFT or upgrade my existing (DRAFT/SUBMITTED) quote;
        None when not matched to the request or in a terminal state."""

    @abstractmethod
    async def submit(self, provider_id: str, quote_id: str) -> Any | None:
        """Publish a DRAFT quote (DRAFT → SUBMITTED)."""

    @abstractmethod
    async def withdraw(self, provider_id: str, quote_id: str) -> Any | None:
        """Withdraw a submitted quote (SUBMITTED → WITHDRAWN)."""

    @abstractmethod
    async def expire(self, provider_id: str) -> list[dict[str, Any]]:
        """Mark this provider's stale submitted quotes EXPIRED; returns them."""

    @abstractmethod
    async def get(self, provider_id: str, quote_id: str) -> Any | None:
        """One of this provider's quotes with full breakdown."""

    @abstractmethod
    async def list(self, provider_id: str) -> list[dict[str, Any]]:
        """This provider's quotes, newest first."""

    @abstractmethod
    async def list_attachments(self, provider_id: str, quote_id: str) -> list[dict[str, Any]]:
        """Attachments on one of my quotes."""

    @abstractmethod
    async def add_attachment(
        self, provider_id: str, quote_id: str, data: dict[str, Any]
    ) -> Any | None:
        """Attach a photo/document to my own quote."""

    @abstractmethod
    async def remove_attachment(
        self, provider_id: str, attachment_id: str
    ) -> Any | None:
        """Delete one of my attachment rows (my quote, DRAFT/SUBMITTED only)."""