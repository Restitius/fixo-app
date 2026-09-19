"""CatalogService — catalog browsing + discovery rules.

Depends ONLY on CatalogRepository (port). No SQL, no query IDs.
"""
from __future__ import annotations

import re
from typing import Any

from app.shared.exceptions.hierarchy import NotFoundError, ValidationError

_SLUG = re.compile(r"^[a-z0-9]+(-[a-z0-9]+)*$")


class CatalogService:
    MAX_LIMIT = 50

    def __init__(self, catalog: Any) -> None:
        self._catalog = catalog

    async def categories(self) -> list[dict[str, Any]]:
        return await self._catalog.categories()

    async def service_detail(self, slug: str) -> dict[str, Any]:
        clean = str(slug or "").strip().lower()
        if not _SLUG.match(clean):
            raise ValidationError("Invalid service slug")
        row = await self._catalog.service_by_slug(clean)
        if not row:
            raise NotFoundError("Service not found")
        return row

    async def search(
        self, term: str, *, limit: int = 20, offset: int = 0
    ) -> dict[str, Any]:
        if not str(term or "").strip():
            raise ValidationError("Search term is required")
        limit = max(1, min(int(limit), self.MAX_LIMIT))
        offset = max(0, int(offset))

        results = await self._catalog.search_services(term, limit=limit, offset=offset)
        return {
            "term": term,
            "count": len(results),
            "limit": limit,
            "offset": offset,
            "results": results,
        }

    async def suggestions(self, prefix: str, *, limit: int = 6) -> list[dict[str, Any]]:
        if len(str(prefix or "").strip()) < 2:
            # Too short to suggest — empty list, not an error.
            return []
        return await self._catalog.suggestions(prefix, limit=max(1, min(int(limit), 10)))