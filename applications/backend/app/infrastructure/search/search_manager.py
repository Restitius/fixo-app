"""SearchManager — facade over search indexes per entity type."""
from __future__ import annotations

from typing import Any


class SearchManager:
    def __init__(self) -> None:
        self._indexes: dict[str, Any] = {}

    def register_index(self, entity: str, index: Any) -> None:
        self._indexes[entity] = index

    async def index(self, entity: str, doc_id: str, document: dict[str, Any]) -> None:
        raise NotImplementedError("SearchManager.index")

    async def search(self, entity: str, query: dict[str, Any], *, size: int = 20) -> list[dict[str, Any]]:
        raise NotImplementedError("SearchManager.search")
