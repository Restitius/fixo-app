"""Repository contract — the persistence boundary every domain repository obeys.

Domains depend on THIS protocol, never on a concrete driver (dependency inversion).
"""
from __future__ import annotations

from typing import Any, Protocol, runtime_checkable


@runtime_checkable
class Repository(Protocol):
    """Minimal asynchronous repository surface."""

    async def get(self, id_: Any) -> Any | None:
        """Fetch one aggregate by identity, or None."""
        ...

    async def add(self, entity: Any) -> Any:
        """Persist a new aggregate and return it."""
        ...

    async def update(self, entity: Any) -> Any:
        """Persist changes to an existing aggregate and return it."""
        ...

    async def remove(self, id_: Any) -> None:
        """Remove (or soft-delete) an aggregate by identity."""
        ...
