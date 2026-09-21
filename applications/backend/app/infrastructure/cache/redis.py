"""Redis adapter implementing the Cache contract (app.contracts.cache.Cache)."""
from __future__ import annotations

from typing import Any


class RedisCache:
    """Thin async wrapper over redis-py asyncio client."""

    def __init__(self, url: str, *, namespace: str = "fixo", default_ttl_seconds: int = 300) -> None:
        self.url = url
        self.namespace = namespace
        self.default_ttl_seconds = default_ttl_seconds

    def _key(self, key: str) -> str:
        return f"{self.namespace}:{key}"

    async def get(self, key: str) -> Any | None:
        raise NotImplementedError("RedisCache.get")

    async def set(self, key: str, value: Any, ttl_seconds: int | None = None) -> None:
        raise NotImplementedError("RedisCache.set")

    async def delete(self, key: str) -> None:
        raise NotImplementedError("RedisCache.delete")

    async def invalidate_prefix(self, prefix: str) -> None:
        raise NotImplementedError("RedisCache.invalidate_prefix (SCAN + UNLINK)")
