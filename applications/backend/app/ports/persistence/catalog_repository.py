"""CatalogRepository — persistence port for catalog browsing + discovery.

Application services depend on THIS protocol; CUS.CATALOG.* / CUS.SEARCH.*
IDs live only in CatalogSqlAdapter / SearchManager.
"""
from __future__ import annotations

from typing import Any, Protocol, runtime_checkable


@runtime_checkable
class CatalogRepository(Protocol):
    async def categories(self) -> list[dict[str, Any]]: ...
    async def service_by_slug(self, slug: str) -> dict[str, Any] | None: ...
    async def search_services(
        self, term: str, *, limit: int = 20, offset: int = 0
    ) -> list[dict[str, Any]]: ...
    async def suggestions(self, prefix: str, *, limit: int = 6) -> list[dict[str, Any]]: ...