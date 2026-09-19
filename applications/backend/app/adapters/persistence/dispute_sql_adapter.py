"""Disputes adapter - the only layer that knows the CUS.DISPUTE.* IDs."""
from __future__ import annotations

from typing import Any

from app.platform.query.sql_query_manager import SQLQueryManager
from app.ports.persistence.dispute_repository import DisputeRepositoryPort

_LIMIT_CAP = 100


class DisputeSqlAdapter(DisputeRepositoryPort):
    def __init__(self, queries: SQLQueryManager) -> None:
        self._queries = queries

    async def create_dispute(
        self, booking_id: str, customer_id: str, category: str, description: str
    ) -> dict[str, Any] | None:
        rows = await self._queries.execute(
            "CUS.DISPUTE.CREATE",
            {
                "booking_id": booking_id,
                "customer_id": customer_id,
                "category": category,
                "description": description,
            },
        )
        return rows[0] if rows else None

    async def list_disputes(
        self, customer_id: str, limit: int = 20, offset: int = 0
    ) -> list[dict[str, Any]]:
        return await self._queries.execute(
            "CUS.DISPUTE.LIST",
            {
                "customer_id": customer_id,
                "limit": max(1, min(limit, _LIMIT_CAP)),
                "offset": max(offset, 0),
            },
        )

    async def get_dispute(self, dispute_id: str, customer_id: str) -> dict[str, Any] | None:
        rows = await self._queries.execute(
            "CUS.DISPUTE.GET",
            {"dispute_id": dispute_id, "customer_id": customer_id},
        )
        return rows[0] if rows else None

    async def add_evidence(
        self, dispute_id: str, customer_id: str, kind: str, url: str, note: str | None
    ) -> dict[str, Any] | None:
        rows = await self._queries.execute(
            "CUS.DISPUTE.EVIDENCE.ADD",
            {
                "dispute_id": dispute_id,
                "customer_id": customer_id,
                "kind": kind,
                "url": url,
                "note": note,
            },
        )
        return rows[0] if rows else None

    async def list_evidence(self, dispute_id: str, customer_id: str) -> list[dict[str, Any]]:
        return await self._queries.execute(
            "CUS.DISPUTE.EVIDENCE.LIST",
            {"dispute_id": dispute_id, "customer_id": customer_id},
        )

    async def withdraw_dispute(self, dispute_id: str, customer_id: str) -> dict[str, Any] | None:
        rows = await self._queries.execute(
            "CUS.DISPUTE.WITHDRAW",
            {"dispute_id": dispute_id, "customer_id": customer_id},
        )
        return rows[0] if rows else None
