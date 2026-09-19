"""ReviewService — Phase 10 module 28."""
from __future__ import annotations

import logging
from typing import Any

from app.shared.exceptions.hierarchy import ValidationError

logger = logging.getLogger(__name__)


class ReviewService:
    def __init__(self, reviews: Any) -> None:
        self._reviews = reviews

    async def create(self, customer_id: str, data: dict[str, Any]) -> dict:
        row = await self._reviews.create(
            data["booking_id"], customer_id,
            data["service_id"], data["provider_id"],
            data["rating"], data.get("comment")
        )
        if not row:
            raise ValidationError("Could not submit the review")
        return row

    async def list(self, customer_id: str, entity_type: str, entity_id: str,
                   page: int, limit: int) -> list[dict]:
        return await self._reviews.list(entity_type, entity_id, customer_id, page, limit)

    async def stats(self, entity_type: str, entity_id: str) -> dict:
        return await self._reviews.stats(entity_type, entity_id)
