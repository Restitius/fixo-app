"""CacheManager — cache lifecycle orchestration (facade)."""
from __future__ import annotations

from typing import Any


class CacheManager:
    """Get/set/invalidate through the configured cache backend."""

    def __init__(self, cache: Any) -> None:
        self._cache = cache

    @property
    def cache(self) -> Any:
        return self._cache

    async def get(self, key: str) -> Any | None:
        return await self._cache.get(key)

    async def set(self, key: str, value: Any, ttl_seconds: int | None = None) -> None:
        await self._cache.set(key, value, ttl_seconds=ttl_seconds)

    async def invalidate_prefix(self, prefix: str) -> None:
        await self._cache.invalidate_prefix(prefix)