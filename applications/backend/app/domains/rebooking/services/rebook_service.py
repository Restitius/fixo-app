"""RebookService — Phase 10 module 30 (rebooking)."""
from __future__ import annotations
import logging
from typing import Any
from app.shared.exceptions.hierarchy import NotFoundError, ValidationError

logger = logging.getLogger(__name__)


class RebookService:
    def __init__(self, rebook: Any) -> None:
        self._rebook = rebook

    async def preview(self, customer_id: str, booking_id: str) -> dict[str, Any]:
        row = await self._rebook.preview(booking_id, customer_id)
        if not row:
            raise NotFoundError("Booking not found or not eligible for rebooking")
        return row

    async def rebook(self, customer_id: str, booking_id: str) -> dict[str, Any]:
        row = await self._rebook.create_request(booking_id, customer_id)
        if not row:
            raise ValidationError("Could not create rebook request")
        return row
