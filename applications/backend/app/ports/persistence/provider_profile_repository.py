"""ProviderProfileRepository port — curated profile + public preview (Phase 3)."""
from __future__ import annotations

from typing import Any, Protocol


class ProviderProfileRepository(Protocol):
    """Storage contract for provider profile curation."""

    async def get(self, provider_id: str) -> Any | None:
        """Full own-profile row (personal + professional fields)."""
        ...

    async def update(self, provider_id: str, fields: dict[str, Any]) -> Any | None:
        """Update only the supplied profile fields; returns the updated row."""
        ...

    async def public_view(self, provider_id: str) -> Any | None:
        """Public-safe projection exactly as customers will see it."""
        ...
