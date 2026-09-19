"""Cancellations adapter - the only layer that knows the CUS.CANCEL.* IDs."""
from __future__ import annotations

from typing import Any

from app.platform.query.sql_query_manager import SQLQueryManager
from app.ports.persistence.cancellation_repository import CancellationRepositoryPort

_LIMIT_CAP = 100


class CancellationSqlAdapter(CancellationRepositoryPort):
    def __init__(self, queries: SQLQueryManager) -> None:
        self._queries = queries

    async def preview_booking(self, booking_id: str, customer_id: str) -> dict[str, Any] | None:
        rows = await self._queries.execute(
            "CUS.CANCEL.PREVIEW",
            {"booking_id": booking_id, "customer_id": customer_id},
        )
        return rows[0] if rows else None

    async def cancel_booking(
        self, booking_id: str, customer_id: str, fee: float, refund: float, reason: str
    ) -> dict[str, Any] | None:
        rows = await self._queries.execute(
            "CUS.CANCEL.REQUEST",
            {
                "booking_id": booking_id,
                "customer_id": customer_id,
                "fee": fee,
                "refund": refund,
                "reason": reason,
            },
        )
        return rows[0] if rows else None

    async def record_cancellation(
        self,
        booking_id: str,
        customer_id: str,
        fee: float,
        refund: float,
        reason: str,
        requested_by: str,
    ) -> dict[str, Any] | None:
        rows = await self._queries.execute(
            "CUS.CANCEL.RECORD",
            {
                "booking_id": booking_id,
                "customer_id": customer_id,
                "fee": fee,
                "refund": refund,
                "reason": reason,
                "requested_by": requested_by,
            },
        )
        return rows[0] if rows else None

    async def list_cancellations(
        self, customer_id: str, limit: int = 20, offset: int = 0
    ) -> list[dict[str, Any]]:
        return await self._queries.execute(
            "CUS.CANCEL.LIST",
            {
                "customer_id": customer_id,
                "limit": max(1, min(limit, _LIMIT_CAP)),
                "offset": max(offset, 0),
            },
        )
