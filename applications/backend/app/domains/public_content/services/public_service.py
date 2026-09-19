"""PublicContentService — public landing/catalog/FAQ reads (no auth required)."""
from __future__ import annotations

from typing import Any


class PublicContentService:
    def __init__(self, content: Any) -> None:
        self._content = content

    async def landing(self) -> dict[str, Any]:
        blocks = await self._content.content_blocks()
        categories = await self._content.categories()
        return {"blocks": blocks, "categories": categories}

    async def categories(self) -> list[dict[str, Any]]:
        return await self._content.categories()

    async def services(self, category_code: str | None = None) -> list[dict[str, Any]]:
        return await self._content.services(category_code)

    async def search(self, term: str) -> list[dict[str, Any]]:
        term = (term or "").strip()
        if len(term) < 2:
            return []
        return await self._content.search_services(term)

    async def faqs(self) -> list[dict[str, Any]]:
        return await self._content.faqs()
