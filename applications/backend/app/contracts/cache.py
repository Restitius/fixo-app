"""Cache contract — key/value caching behind an interface."""
from __future__ import annotations

from typing import Any, Protocol, runtime_checkable


@runtime_checkable
class Cache(Protocol):
    """Minimal asynchronous cache surface."""

    async def get(self, key: str) -> Any | None:
        """Return the cached value for a key, or None."""
        ...

    async def set(self, key: str, value: Any, ttl_seconds: int | None = None) -> None:
        """Store a value with an optional TTL."""
        ...

    async def delete(self, key: str) -> None:
        """Remove a key."""
        ...

    async def invalidate_prefix(self, prefix: str) -> None:
        """Invalidate every key starting with a prefix (e.g. on domain events)."""
        ...
