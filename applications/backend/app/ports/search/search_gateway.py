"""SearchGateway — free-text search capability."""
from __future__ import annotations

from typing import Any, Protocol, runtime_checkable


@runtime_checkable
class SearchGateway(Protocol):
    """Index and query business entities in a search backend."""

    async def search(self, index: str, query: str, *, filters: dict[str, Any] | None = None, limit: int = 20) -> list[Any]: ...