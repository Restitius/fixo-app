"""ProviderBusinessRepository port — company business profile (Phase 4)."""
from __future__ import annotations

from typing import Any, Protocol


class ProviderBusinessRepository(Protocol):
    """Storage contract for the provider's business profile (1:1)."""

    async def get(self, provider_id: str) -> Any | None:
        """The provider's business profile row, or None if not created yet."""
        ...

    async def upsert(self, provider_id: str, fields: dict[str, Any]) -> Any | None:
        """Create or partially update; absent fields keep current values."""
        ...

    async def delete(self, provider_id: str) -> Any | None:
        """Remove the business profile; returns the deleted row or None."""
        ...