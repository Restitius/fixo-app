"""ProviderDirectoryService — Module 14: read-only provider profiles."""
from __future__ import annotations

import re
from typing import Any

from app.shared.exceptions.hierarchy import NotFoundError, ValidationError

_SLUG = re.compile(r"^[a-z0-9]+(-[a-z0-9]+)*$")


class ProviderDirectoryService:
    def __init__(self, providers: Any) -> None:   # ProviderReadPort
        self._providers = providers

    async def profile(self, provider_id: str) -> dict[str, Any]:
        row = await self._providers.profile(provider_id)
        if not row:
            raise NotFoundError("Provider not found")
        return row

    async def by_service(self, slug: str) -> list[dict[str, Any]]:
        clean = str(slug or "").strip().lower()
        if not _SLUG.match(clean):
            raise ValidationError("Invalid service slug")
        return await self._providers.list_by_service(clean)