"""StorageProvider contract — external object storage surface."""
from __future__ import annotations

from abc import abstractmethod

from app.integrations.external.contracts.base_integration import BaseIntegration


class StorageProvider(BaseIntegration):
    @abstractmethod
    async def upload(self, key: str, data: bytes, content_type: str | None = None) -> dict:
        """Upload bytes; return provider-specific descriptor."""

    @abstractmethod
    async def download(self, key: str) -> bytes:
        """Download object bytes."""

    @abstractmethod
    async def presign(self, key: str, expires_in: int = 3600) -> str:
        """Presigned URL for direct client access."""
