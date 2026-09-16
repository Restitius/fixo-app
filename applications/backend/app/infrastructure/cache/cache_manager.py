"""CacheManager — namespaced facade over a Cache backend."""
from __future__ import annotations

from collections.abc import Awaitable, Callable
from typing import Any

from app.contracts.cache import Cache


class NamespacedCache:
    """Prefixes every key with a namespace before hitting the backend."""

    def __init__(self, backend: Cache | None, namespace: str) -> None:
        self._backend = backend
        self._namespace = namespace.rstrip(":")

    def _key(self, key: str) -> str:
        return f"{self._namespace}:{key}"

    async def get(self, key: str) -> Any | None:
        if self._backend is None:
            return None
        return await self._backend.get(self._key(key))

    async def set(self, key: str, value: Any, ttl_seconds: int | None = None) -> None:
        if self._backend is None:
            return
        await self._backend.set(self._key(key), value, ttl_seconds)

    async def delete(self, key: str) -> None:
        if self._backend is None:
            return
        await self._backend.delete(self._key(key))

    async def invalidate_prefix(self, prefix: str) -> None:
        if self._backend is None:
            return
        await self._backend.invalidate_prefix(f"{self._namespace}:{prefix}")


class CacheManager:
    """Entry point for caches; degrades gracefully to no-op without backend."""

    def __init__(self, backend: Cache | None = None) -> None:
        self._backend = backend

    def namespace(self, name: str) -> NamespacedCache:
        return NamespacedCache(self._backend, name)

    async def remember(
        self,
        key: str,
        ttl_seconds: int,
        factory: Callable[[], Awaitable[Any]],
        *,
        ns: str = "misc",
    ) -> Any:
        """Get-or-compute pattern; backend misses invoke the factory."""
        cache = self.namespace(ns)
        cached = await cache.get(key)
        if cached is not None:
            return cached
        value = await factory()
        await cache.set(key, value, ttl_seconds)
        return value
