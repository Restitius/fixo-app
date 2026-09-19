"""ProviderJobEvidenceSqlAdapter — implemented via governed queries (Phase 22).

The only code that knows PROV.EVIDENCE.* query ids. Evidence items
(photos, videos, notes, measurements, customer instructions, replacement
parts) are stored against the booking with a BEFORE/DURING/AFTER phase.
"""
from __future__ import annotations

from typing import Any


class ProviderJobEvidenceQueryIds:
    ADD = "PROV.EVIDENCE.ADD"
    LIST = "PROV.EVIDENCE.LIST"
    DELETE = "PROV.EVIDENCE.DELETE"
    SUMMARY = "PROV.EVIDENCE.SUMMARY"


class ProviderJobEvidenceSqlAdapter:
    def __init__(self, sql_query_manager: Any) -> None:
        self._sql = sql_query_manager

    async def add(
        self,
        provider_id: str,
        booking_id: str,
        phase: str,
        kind: str,
        title: str | None,
        body: str | None,
        media_url: str | None,
        quantity: float | None,
        unit: str | None,
    ) -> dict[str, Any] | None:
        return await self._sql.execute(
            ProviderJobEvidenceQueryIds.ADD,
            {
                "user_id": provider_id,
                "booking_id": booking_id,
                "phase": phase,
                "kind": kind,
                "title": title,
                "body": body,
                "media_url": media_url,
                "quantity": quantity,
                "unit": unit,
            },
            fetch="one",
        )

    async def list_for_booking(
        self,
        provider_id: str,
        booking_id: str,
        phase: str | None = None,
        kind: str | None = None,
    ) -> list[dict[str, Any]]:
        rows = await self._sql.execute(
            ProviderJobEvidenceQueryIds.LIST,
            {
                "user_id": provider_id,
                "booking_id": booking_id,
                "phase": phase,
                "kind": kind,
            },
            fetch="all",
        )
        return list(rows or [])

    async def delete(
        self, provider_id: str, evidence_id: str
    ) -> dict[str, Any] | None:
        return await self._sql.execute(
            ProviderJobEvidenceQueryIds.DELETE,
            {
                "user_id": provider_id,
                "evidence_id": evidence_id,
            },
            fetch="one",
        )

    async def summary(
        self, provider_id: str, booking_id: str
    ) -> list[dict[str, Any]]:
        rows = await self._sql.execute(
            ProviderJobEvidenceQueryIds.SUMMARY,
            {
                "user_id": provider_id,
                "booking_id": booking_id,
            },
            fetch="all",
        )
        return list(rows or [])
