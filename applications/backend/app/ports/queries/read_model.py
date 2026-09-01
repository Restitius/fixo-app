"""ReadModel — read-side projection query port (CQRS read model).

Query *services* depend on THIS to fetch application read views without any
awareness of SQL or the query registry. Adapters implement it against governed
queries.
"""
from __future__ import annotations

from typing import Any, Protocol, runtime_checkable


@runtime_checkable
class ReadModel(Protocol):
    """Fetch a read-model projection by a stable business query name."""

    async def fetch_one(self, model: str, params: dict[str, Any]) -> Any | None: ...
    async def fetch_list(self, model: str, params: dict[str, Any]) -> list[Any]: ...