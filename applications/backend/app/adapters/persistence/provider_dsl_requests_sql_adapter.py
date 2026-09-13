"""ProviderDslRequestsSqlAdapter — SQL-backed DSL requests (Phase 38).

Routes operations through governed queries:
- PROV.DSL.REQUESTS.LIST / GET / CREATE / UPDATE / RESOLVE
- PROV.DSL.EXECUTION_LOGS.INSERT / LIST
- PROV.DSL.PROVIDER_METRICS.GET
"""

from __future__ import annotations

import uuid
from typing import Any

from app.ports.persistence.provider_dsl_requests_repository import (
    ProviderDslRequestsRepository,
)


class ProviderDslRequestsSqlAdapter(ProviderDslRequestsRepository):
    def __init__(self, queries: Any) -> None:
        self._queries = queries

    async def list(
        self,
        provider_id: str,
        *,
        status: str | None = None,
        dsl_kind: str | None = None,
        limit: int = 50,
        offset: int = 0,
    ) -> list[Any]:
        """List provider DSL requests, newest first."""
        return await self._queries.execute(
            "PROV.DSL.REQUESTS.LIST",
            {
                "provider_id": provider_id,
                "status": status,
                "dsl_kind": dsl_kind,
                "limit": limit,
                "offset": offset,
            },
        )

    async def get(self, provider_id: str, *, request_id: str) -> Any | None:
        """Fetch a single DSL request by id (ownership-scoped)."""
        rows = await self._queries.execute(
            "PROV.DSL.REQUESTS.GET",
            {"provider_id": provider_id, "id": request_id},
        )
        return rows[0] if rows else None

    async def create(
        self,
        provider_id: str,
        *,
        dsl_kind: str,
        subject_type: str,
        subject_id: str,
        title: str,
        dsl: Any,
        status: str = "open",
        priority: str = "medium",
        reason: str | None = None,
        requested_by: str,
        parent_id: str | None = None,
        root_request_id: str | None = None,
    ) -> Any | None:
        """Create one DSL request for a provider."""
        rows = await self._queries.execute(
            "PROV.DSL.REQUESTS.CREATE",
            {
                "id": str(uuid.uuid4()),
                "provider_id": provider_id,
                "dsl_kind": dsl_kind,
                "subject_type": subject_type,
                "subject_id": subject_id,
                "title": title,
                "dsl": dsl,
                "status": status,
                "priority": priority,
                "reason": reason,
                "requested_by": requested_by,
                "parent_id": parent_id,
                "root_request_id": root_request_id,
            },
        )
        return rows[0] if rows else None

    async def update(
        self,
        provider_id: str,
        *,
        request_id: str,
        status: str | None = None,
        priority: str | None = None,
        reason: str | None = None,
        title: str | None = None,
        dsl: Any = None,
        resolved_by: str | None = None,
        parent_id: str | None = None,
        root_request_id: str | None = None,
    ) -> Any | None:
        """Update mutable DSL request fields (ownership-scoped)."""
        rows = await self._queries.execute(
            "PROV.DSL.REQUESTS.UPDATE",
            {
                "provider_id": provider_id,
                "id": request_id,
                "status": status,
                "priority": priority,
                "reason": reason,
                "title": title,
                "dsl": dsl,
                "resolved_by": resolved_by,
                "parent_id": parent_id,
                "root_request_id": root_request_id,
            },
        )
        return rows[0] if rows else None

    async def resolve(
        self, provider_id: str, *, request_id: str, resolved_by: str
    ) -> Any | None:
        """Close a DSL request as resolved (ownership-scoped)."""
        rows = await self._queries.execute(
            "PROV.DSL.REQUESTS.RESOLVE",
            {"provider_id": provider_id, "id": request_id, "resolved_by": resolved_by},
        )
        return rows[0] if rows else None

    async def append_execution_log(
        self,
        *,
        dsl_request_id: str,
        step_order: int,
        action: str,
        status: str,
        summary: Any = None,
        error: Any = None,
    ) -> Any | None:
        """Append one execution step for a DSL request."""
        rows = await self._queries.execute(
            "PROV.DSL.EXECUTION_LOGS.INSERT",
            {
                "id": str(uuid.uuid4()),
                "dsl_request_id": dsl_request_id,
                "step_order": step_order,
                "action": action,
                "status": status,
                "summary": summary,
                "error": error,
                "started_at": None,
                "finished_at": None,
            },
        )
        return rows[0] if rows else None

    async def list_execution_logs(self, *, dsl_request_id: str) -> list[Any]:
        """Read execution steps for a DSL request, in order."""
        return await self._queries.execute(
            "PROV.DSL.EXECUTION_LOGS.LIST",
            {"dsl_request_id": dsl_request_id},
        )

    async def get_metrics(self, provider_id: str, *, period: str) -> Any | None:
        """Read provider DSL lifetime metrics for a period."""
        rows = await self._queries.execute(
            "PROV.DSL.PROVIDER_METRICS.GET",
            {"provider_id": provider_id, "period": period},
        )
        return rows[0] if rows else None

