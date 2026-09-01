"""Review SQL adapter - translates business operations into governed SQL query IDs."""
from __future__ import annotations
from typing import Any

from app.platform.query.sql_query_manager import SQLQueryManager
from app.ports.persistence.review_repository import ReviewRepositoryPort
from app.shared.exceptions.hierarchy import ValidationError


class ReviewSqlAdapter(ReviewRepositoryPort):
    """The ONLY place where CUS.REVIEW.* IDs appear."""

    def __init__(self, sql_manager: SQLQueryManager) -> None:
        self._sql = sql_manager

    async def create(self, booking_id: str, customer_id: str, service_id: str,
                     provider_id: str, rating: int, comment: str | None) -> dict[str, Any]:
        # service/provider are derived from the booking inside SQL (single source of truth).
        row = await self._sql.execute(
            "CUS.REVIEW.CREATE",
            {"booking_id": booking_id, "customer_id": customer_id,
             "rating": rating, "comment": comment},
            fetch="one",
        )
        return dict(row) if row else {}

    async def list(self, entity_type: str, entity_id: str, customer_id: str,
                   page: int, limit: int) -> list[dict[str, Any]]:
        offset = (page - 1) * limit
        if entity_type == "customer":
            rows = await self._sql.execute(
                "CUS.REVIEW.LIST",
                {"customer_id": customer_id, "offset": offset, "limit": limit},
                fetch="all",
            )
        else:
            # Public listing scoped to a provider (service filter optional).
            provider_id, _, service_id = entity_id.partition(":")
            rows = await self._sql.execute(
                "CUS.REVIEW.SERVICE_LIST",
                {"provider_id": provider_id, "service_id": service_id or None,
                 "offset": offset, "limit": limit},
                fetch="all",
            )
        return list(rows or [])

    async def stats(self, entity_type: str, entity_id: str) -> dict[str, Any]:
        if entity_type not in ("provider", "service"):
            raise ValidationError("Stats are only available per provider")
        row = await self._sql.execute(
            "CUS.REVIEW.STATS", {"provider_id": entity_id}, fetch="one",
        )
        return dict(row) if row else {"total": 0, "avg_rating": 0}


