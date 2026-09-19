"""Warranty SQL adapter - translates business operations into governed SQL query IDs."""
from __future__ import annotations

from typing import Any

from app.platform.query.sql_query_manager import SQLQueryManager
from app.ports.persistence.warranty_repository import WarrantyRepositoryPort


class WarrantySqlAdapter(WarrantyRepositoryPort):
    """The ONLY place where CUS.WARRANTY.* IDs appear."""

    def __init__(self, sql_manager: SQLQueryManager) -> None:
        self._sql = sql_manager

    async def create(self, booking_id: str, customer_id: str, provider_id: str,
                     service_id: str, starts_at: str, expires_at: str) -> dict[str, Any]:
        row = await self._sql.execute(
            "CUS.WARRANTY.CREATE",
            {"booking_id": booking_id, "customer_id": customer_id, "expires_at": expires_at},
            fetch="one",
        )
        return dict(row) if row else {}

    async def list(self, customer_id: str, page: int, limit: int) -> list[dict[str, Any]]:
        offset = (page - 1) * limit
        rows = await self._sql.execute(
            "CUS.WARRANTY.LIST",
            {"customer_id": customer_id, "offset": offset, "limit": limit},
            fetch="all",
        )
        return list(rows or [])

    async def get(self, warranty_id: str, customer_id: str) -> dict[str, Any] | None:
        row = await self._sql.execute(
            "CUS.WARRANTY.GET",
            {"warranty_id": warranty_id, "customer_id": customer_id},
            fetch="one",
        )
        return dict(row) if row else None

    async def claim(self, warranty_id: str, customer_id: str, description: str) -> dict[str, Any]:
        row = await self._sql.execute(
            "CUS.WARRANTY.CLAIM",
            {"warranty_id": warranty_id, "customer_id": customer_id,
             "description": description},
            fetch="one",
        )
        return dict(row) if row else {}

