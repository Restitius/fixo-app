"""ProviderDisputesSqlAdapter — SQL-backed provider disputes (Phase 39).

Routes operations through governed queries:
- PROV.DISPUTE.LIST            — provider disputes listing (status/booking filters)
- PROV.DISPUTE.GET             — single dispute fetch (ownership-scoped)
- PROV.DISPUTE.EVIDENCE.LIST   — evidence on a dispute (ownership-scoped)
- PROV.DISPUTE.RESPOND         — submit a provider response
- PROV.DISPUTE.RESPONSES.LIST  — responses given for a dispute
"""

from __future__ import annotations

from typing import Any

from app.ports.persistence.provider_disputes_repository import ProviderDisputesRepository


class ProviderDisputesSqlAdapter(ProviderDisputesRepository):
    def __init__(self, queries: Any) -> None:
        self._queries = queries

    async def list(
        self,
        provider_id: str,
        *,
        status: str | None = None,
        booking_id: str | None = None,
        limit: int = 50,
        offset: int = 0,
    ) -> list[Any]:
        """List provider disputes on their bookings, newest first."""
        return await self._queries.execute(
            "PROV.DISPUTE.LIST",
            {
                "provider_id": provider_id,
                "status": status,
                "booking_id": booking_id,
                "limit": limit,
                "offset": offset,
            },
        )

    async def get(self, provider_id: str, *, dispute_id: str) -> Any | None:
        """Fetch a single dispute by id (ownership-scoped)."""
        rows = await self._queries.execute(
            "PROV.DISPUTE.GET",
            {"provider_id": provider_id, "dispute_id": dispute_id},
        )
        return rows[0] if rows else None

    async def list_evidence(self, provider_id: str, *, dispute_id: str) -> list[Any]:
        """List evidence on a dispute (ownership-scoped)."""
        return await self._queries.execute(
            "PROV.DISPUTE.EVIDENCE.LIST",
            {"provider_id": provider_id, "dispute_id": dispute_id},
        )

    async def respond(
        self, provider_id: str, *, dispute_id: str, kind: str, body: str
    ) -> Any | None:
        """Submit a provider response to an owned dispute."""
        rows = await self._queries.execute(
            "PROV.DISPUTE.RESPOND",
            {"provider_id": provider_id, "dispute_id": dispute_id, "kind": kind, "body": body},
        )
        return rows[0] if rows else None

    async def list_responses(self, provider_id: str, *, dispute_id: str) -> list[Any]:
        """List provider responses for a dispute (ownership-scoped)."""
        return await self._queries.execute(
            "PROV.DISPUTE.RESPONSES.LIST",
            {"provider_id": provider_id, "dispute_id": dispute_id},
        )