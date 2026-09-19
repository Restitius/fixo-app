"""StorageIntegrationAdapter — implements the StorageGateway port via storage manager."""
from __future__ import annotations

from app.infrastructure.storage.storage_manager import StorageManager


class StorageIntegrationAdapter:
    """Object-storage surface backed by the infrastructure storage manager."""

    def __init__(self, storage_manager: StorageManager) -> None:
        self._storage = storage_manager

    async def put(self, key: str, data: bytes, content_type: str | None = None) -> str:
        return await self._storage.put(key, data, content_type=content_type)

    async def get(self, key: str) -> bytes:
        return await self._storage.get(key)

    async def delete(self, key: str) -> None:
        await self._storage.delete(key)

    def url(self, key: str, expires_in: int = 3600) -> str:
        backend = self._storage.backend_for(key)
        return backend.url(key, expires_in=expires_in)