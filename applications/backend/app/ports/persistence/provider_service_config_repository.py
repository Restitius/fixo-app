"""ProviderServiceConfigRepository port — per-service configuration + approval (Phase 6)."""
from __future__ import annotations

from typing import Any, Protocol


class ProviderServiceConfigRepository(Protocol):
    """Storage contract for a provider's configured services and their approval state."""

    async def catalog(self) -> list[dict[str, Any]]:
        """Active catalogue services available for configuration."""
        ...

    async def list_configs(self, provider_id: str) -> list[dict[str, Any]]:
        """The provider's configured services (every non-archived lifecycle state)."""
        ...

    async def get_config(self, provider_id: str, service_id: str) -> Any | None:
        """One configured service; None when absent or archived."""
        ...

    async def upsert_config(
        self, provider_id: str, service_id: str, data: dict[str, Any]
    ) -> Any | None:
        """Create/replace the configuration for one service (resets approval to DRAFT)."""
        ...

    async def archive_config(self, provider_id: str, service_id: str) -> Any | None:
        """Soft-delete the configuration; None when already archived or absent."""
        ...

    async def submit_for_approval(
        self, provider_id: str, service_id: str
    ) -> Any | None:
        """DRAFT/REJECTED -> PENDING_APPROVAL; None when the current state forbids it."""
        ...

    async def review_config(
        self,
        provider_id: str,
        service_id: str,
        reviewer_id: str,
        decision: str,
        review_notes: str | None,
    ) -> Any | None:
        """Platform decision on a PENDING_APPROVAL configuration; None if not reviewable."""
        ...
