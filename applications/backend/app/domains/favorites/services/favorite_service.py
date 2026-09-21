"""FavoriteService — Phase 10 module 30."""
from __future__ import annotations

import logging
from typing import Any

from app.shared.exceptions.hierarchy import ValidationError

logger = logging.getLogger(__name__)


class FavoriteService:
    def __init__(self, favorites: Any) -> None:
        self._favorites = favorites

    async def toggle(self, customer_id: str, provider_id: str) -> dict:
        row = await self._favorites.toggle(customer_id, provider_id)
        if not row:
            raise ValidationError("Could not update favorites")
        return row

    async def list(self, customer_id: str, page: int, limit: int) -> list[dict]:
        return await self._favorites.list(customer_id, page, limit)
