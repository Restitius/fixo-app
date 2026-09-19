"""ProviderSafetySqlAdapter - the only layer that knows the PROV.SAFETY.* IDs."""
from __future__ import annotations

from typing import Any

from app.ports.persistence.provider_safety_repository import ProviderSafetyRepositoryPort

_LIMIT_CAP = 100


class ProviderSafetySqlAdapter(ProviderSafetyRepositoryPort):
    def __init__(self, queries: Any) -> None:
        self._queries = queries

    async def create_report(
        self,
        provider_id: str,
        *,
        booking_id: str | None,
        category: str,
        severity: str,
        description: str,
    ) -> dict[str, Any] | None:
        rows = await self._queries.execute(
            "PROV.SAFETY.REPORTS.CREATE",
            {
                "provider_id": provider_id,
                "booking_id": booking_id,
                "category": category,
                "severity": severity,
                "description": description,
            },
        )
        return rows[0] if rows else None

    async def list_reports(
        self,
        provider_id: str,
        *,
        status: str | None = None,
        category: str | None = None,
        limit: int = 20,
        offset: int = 0,
    ) -> list[dict[str, Any]]:
        return await self._queries.execute(
            "PROV.SAFETY.REPORTS.LIST",
            {
                "user_id": provider_id,
                "status": status,
                "category": category,
                "limit": max(1, min(limit, _LIMIT_CAP)),
                "offset": max(offset, 0),
            },
        )

    async def get_report(self, provider_id: str, *, report_id: str) -> dict[str, Any] | None:
        rows = await self._queries.execute(
            "PROV.SAFETY.REPORTS.GET",
            {"user_id": provider_id, "report_id": report_id},
        )
        return rows[0] if rows else None

    async def escalate(self, provider_id: str, *, report_id: str) -> dict[str, Any] | None:
        rows = await self._queries.execute(
            "PROV.SAFETY.REPORTS.ESCALATE",
            {"user_id": provider_id, "report_id": report_id},
        )
        return rows[0] if rows else None
