"""WarrantyService — Phase 10 module 29."""
from __future__ import annotations

import logging
from typing import Any

from app.shared.exceptions.hierarchy import NotFoundError

logger = logging.getLogger(__name__)


class WarrantyService:
    def __init__(self, warranties: Any) -> None:
        self._warranties = warranties

    async def list(self, customer_id: str, page: int, limit: int) -> list[dict]:
        return await self._warranties.list(customer_id, page, limit)

    async def get(self, customer_id: str, warranty_id: str) -> dict:
        row = await self._warranties.get(warranty_id, customer_id)
        if not row:
            raise NotFoundError("Warranty not found")
        return row

    async def claim(self, customer_id: str, warranty_id: str, description: str) -> dict:
        row = await self._warranties.claim(warranty_id, customer_id, description)
        if not row:
            raise NotFoundError("Warranty not found or not claimable")
        return row
