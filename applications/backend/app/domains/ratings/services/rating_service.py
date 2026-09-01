"""RatingService — Module 51 (customer star ratings and reviews).

Business rules:
  - only CLOSED bookings can be rated
  - one rating per booking (upsert)
  - rating 1-5
"""
from __future__ import annotations
from typing import Any

from app.ports.persistence.phase16_ports import RatingRepositoryPort


class RatingService:
    def __init__(self, repo: RatingRepositoryPort) -> None:
        self._repo = repo

    async def submit(self, booking_id: str, customer_id: str, rating: int, comment: str | None = None) -> dict[str, Any]:
        if not (1 <= rating <= 5):
            raise ValueError("Rating must be 1-5")
        if comment is not None and len(comment) > 500:
            raise ValueError("Comment must be ≤500 characters")
        result = await self._repo.submit(booking_id, customer_id, rating, comment)
        if result is None:
            raise ValueError("Cannot rate this booking (must be CLOSED and owned by you)")
        return result

    async def get_for_booking(self, booking_id: str, customer_id: str) -> dict[str, Any]:
        result = await self._repo.get_for_booking(booking_id, customer_id)
        if result is None:
            raise ValueError("No rating found for this booking")
        return result

    async def provider_stars(self, provider_id: str) -> dict[str, Any]:
        result = await self._repo.provider_stars(provider_id)
        if result is None:
            return {"avg_rating": 0.0, "total_ratings": 0}
        return result

    async def list_mine(self, customer_id: str) -> list[dict[str, Any]]:
        return await self._repo.list_mine(customer_id)