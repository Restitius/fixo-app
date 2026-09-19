"""Storage contract — binary object storage behind an interface."""
from __future__ import annotations

from typing import Protocol, runtime_checkable


@runtime_checkable
class Storage(Protocol):
    """Minimal asynchronous object-storage surface."""

    async def put(self, key: str, data: bytes, content_type: str | None = None) -> str:
        """Store an object; return its storage key/path."""
        ...

    async def get(self, key: str) -> bytes:
        """Read an object's bytes."""
        ...

    async def delete(self, key: str) -> None:
        """Delete an object."""
        ...

    def url(self, key: str, expires_in: int = 3600) -> str:
        """A (optionally signed) URL for an object."""
        ...
