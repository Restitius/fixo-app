"""ProviderJobAssignmentsSqlAdapter - the only layer that knows the PROV.JOB_ASSIGNMENTS.* IDs."""
from __future__ import annotations

from typing import Any

from sqlalchemy.exc import IntegrityError

from app.ports.persistence.provider_job_assignments_repository import (
    ProviderJobAssignmentsRepositoryPort,
)
from app.shared.exceptions.hierarchy import ConflictError

_LIMIT_CAP = 100


class ProviderJobAssignmentsSqlAdapter(ProviderJobAssignmentsRepositoryPort):
    def __init__(self, queries: Any) -> None:
        self._queries = queries

    async def create(
        self, provider_id: str, *, booking_id: str, member_id: str, notes: str | None
    ) -> dict[str, Any] | None:
        try:
            rows = await self._queries.execute(
                "PROV.JOB_ASSIGNMENTS.CREATE",
                {
                    "provider_id": provider_id,
                    "booking_id": booking_id,
                    "member_id": member_id,
                    "notes": notes,
                },
            )
        except IntegrityError as exc:
            raise ConflictError("This booking already has an active assignment") from exc
        return rows[0] if rows else None

    async def list_assignments(
        self,
        provider_id: str,
        *,
        status: str | None = None,
        member_id: str | None = None,
        limit: int = 20,
        offset: int = 0,
    ) -> list[dict[str, Any]]:
        return await self._queries.execute(
            "PROV.JOB_ASSIGNMENTS.LIST",
            {
                "user_id": provider_id,
                "status": status,
                "member_id": member_id,
                "limit": max(1, min(limit, _LIMIT_CAP)),
                "offset": max(offset, 0),
            },
        )

    async def get(self, provider_id: str, *, assignment_id: str) -> dict[str, Any] | None:
        rows = await self._queries.execute(
            "PROV.JOB_ASSIGNMENTS.GET",
            {"user_id": provider_id, "assignment_id": assignment_id},
        )
        return rows[0] if rows else None

    async def update(
        self,
        provider_id: str,
        *,
        assignment_id: str,
        member_id: str | None = None,
        status: str | None = None,
        notes: str | None = None,
    ) -> dict[str, Any] | None:
        try:
            rows = await self._queries.execute(
                "PROV.JOB_ASSIGNMENTS.UPDATE",
                {
                    "user_id": provider_id,
                    "assignment_id": assignment_id,
                    "member_id": member_id,
                    "status": status,
                    "notes": notes,
                },
            )
        except IntegrityError as exc:
            raise ConflictError("Update rejected by data constraints") from exc
        return rows[0] if rows else None

    async def cancel(self, provider_id: str, *, assignment_id: str) -> dict[str, Any] | None:
        rows = await self._queries.execute(
            "PROV.JOB_ASSIGNMENTS.CANCEL",
            {"user_id": provider_id, "assignment_id": assignment_id},
        )
        return rows[0] if rows else None
