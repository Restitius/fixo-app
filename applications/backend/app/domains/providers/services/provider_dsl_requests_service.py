"""ProviderDslRequestsService — DSL-based cancellation/rescheduling (Phase 38).

Manages provider-facing DSL requests: list with filters (status, dsl_kind),
fetch single by id (ownership-scoped), create, update, resolve (close),
read execution logs, and read provider lifetime metrics.

DSL kinds: cancellation, reschedule.
Statuses: open, escalated, closed, canceled.
Priorities: low, medium, high, urgent.

No background workers in this phase — requests are managed synchronously
through the service layer.
"""

from typing import Any

from app.shared.exceptions.hierarchy import NotFoundError, ValidationError


# -- pagination defaults ------------------------------------------------------
DEFAULT_LIMIT = 50
MAX_LIMIT = 100


# -- DSL request enums --------------------------------------------------------
DSL_KINDS = frozenset({"cancellation", "reschedule"})
DSL_STATUSES = frozenset({"open", "escalated", "closed", "canceled"})
DSL_PRIORITIES = frozenset({"low", "medium", "high", "urgent"})
DSL_LIST_STATUSES = frozenset({"open", "escalated", "closed", "canceled", "all"})


class ProviderDslRequestsService:
    """Domain service for provider DSL request operations."""

    def __init__(self, dsl_requests: Any) -> None:
        self._dsl_requests = dsl_requests

    # -- DSL requests ---------------------------------------------------------

    async def list_requests(
        self,
        provider_id: str,
        *,
        status: str | None = None,
        dsl_kind: str | None = None,
        limit: int = DEFAULT_LIMIT,
        offset: int = 0,
    ) -> dict[str, Any]:
        """List provider DSL requests, newest first."""
        if status is not None and status not in DSL_LIST_STATUSES:
            raise ValidationError(
                f"status must be one of: {', '.join(sorted(DSL_LIST_STATUSES))}"
            )
        if dsl_kind is not None and dsl_kind not in DSL_KINDS:
            raise ValidationError(
                f"dsl_kind must be one of: {', '.join(sorted(DSL_KINDS))}"
            )
        if limit < 1 or limit > MAX_LIMIT:
            raise ValidationError(f"limit must be between 1 and {MAX_LIMIT}")
        if offset < 0:
            raise ValidationError("offset must be >= 0")
        rows = await self._dsl_requests.list(
            provider_id,
            status=None if status == "all" else status,
            dsl_kind=dsl_kind,
            limit=limit,
            offset=offset,
        )
        return {
            "requests": [self._encode_request(r) for r in rows],
            "limit": limit,
            "offset": offset,
        }

    async def get_request(
        self, provider_id: str, *, request_id: str
    ) -> dict[str, Any]:
        """Fetch a single DSL request by id (ownership-checked)."""
        row = await self._dsl_requests.get(provider_id, request_id=request_id)
        if row is None:
            raise NotFoundError("DSL request not found")
        return self._encode_request(row)

    async def create_request(
        self,
        provider_id: str,
        *,
        dsl_kind: str,
        subject_type: str,
        subject_id: str,
        title: str,
        dsl: Any,
        priority: str = "medium",
        reason: str | None = None,
        parent_id: str | None = None,
        root_request_id: str | None = None,
    ) -> dict[str, Any]:
        """Create one DSL request for a provider."""
        if dsl_kind not in DSL_KINDS:
            raise ValidationError(
                f"dsl_kind must be one of: {', '.join(sorted(DSL_KINDS))}"
            )
        if priority not in DSL_PRIORITIES:
            raise ValidationError(
                f"priority must be one of: {', '.join(sorted(DSL_PRIORITIES))}"
            )
        if not title or not title.strip():
            raise ValidationError("title is required")
        if len(title.strip()) > 256:
            raise ValidationError("title must be at most 256 characters")
        if not subject_type or not subject_type.strip():
            raise ValidationError("subject_type is required")
        if not subject_id or not str(subject_id).strip():
            raise ValidationError("subject_id is required")
        if dsl is None:
            raise ValidationError("dsl payload is required")
        row = await self._dsl_requests.create(
            provider_id,
            dsl_kind=dsl_kind,
            subject_type=subject_type.strip(),
            subject_id=str(subject_id).strip(),
            title=title.strip(),
            dsl=dsl,
            status="open",
            priority=priority,
            reason=reason,
            requested_by=provider_id,
            parent_id=parent_id,
            root_request_id=root_request_id,
        )
        if row is None:
            raise ValidationError("Could not create DSL request")
        full = await self._dsl_requests.get(provider_id, request_id=str(row.get("id")))
        return self._encode_request(full) if full else self._encode_request(row)

    async def update_request(
        self,
        provider_id: str,
        *,
        request_id: str,
        status: str | None = None,
        priority: str | None = None,
        reason: str | None = None,
        title: str | None = None,
        dsl: Any = None,
    ) -> dict[str, Any]:
        """Update mutable DSL request fields (ownership-checked)."""
        if status is not None and status not in DSL_STATUSES:
            raise ValidationError(
                f"status must be one of: {', '.join(sorted(DSL_STATUSES))}"
            )
        if priority is not None and priority not in DSL_PRIORITIES:
            raise ValidationError(
                f"priority must be one of: {', '.join(sorted(DSL_PRIORITIES))}"
            )
        if title is not None and len(title.strip()) > 256:
            raise ValidationError("title must be at most 256 characters")
        row = await self._dsl_requests.update(
            provider_id,
            request_id=request_id,
            status=status,
            priority=priority,
            reason=reason,
            title=title.strip() if title is not None else None,
            dsl=dsl,
        )
        if row is None:
            raise NotFoundError("DSL request not found")
        full = await self._dsl_requests.get(provider_id, request_id=request_id)
        return self._encode_request(full) if full else self._encode_request(row)

    async def resolve_request(
        self, provider_id: str, *, request_id: str
    ) -> dict[str, Any]:
        """Close a DSL request as resolved (ownership-checked)."""
        row = await self._dsl_requests.resolve(
            provider_id, request_id=request_id, resolved_by=provider_id
        )
        if row is None:
            raise NotFoundError("DSL request not found")
        full = await self._dsl_requests.get(provider_id, request_id=request_id)
        return self._encode_request(full) if full else self._encode_request(row)

    async def list_execution_logs(
        self, provider_id: str, *, request_id: str
    ) -> dict[str, Any]:
        """Read execution steps for a DSL request (ownership-checked)."""
        existing = await self._dsl_requests.get(provider_id, request_id=request_id)
        if existing is None:
            raise NotFoundError("DSL request not found")
        rows = await self._dsl_requests.list_execution_logs(dsl_request_id=request_id)
        return {"request_id": request_id, "logs": [self._encode_log(r) for r in rows]}

    async def get_metrics(self, provider_id: str, *, period: str) -> dict[str, Any]:
        """Read provider DSL lifetime metrics for a period."""
        if not period or not period.strip():
            raise ValidationError("period is required")
        row = await self._dsl_requests.get_metrics(provider_id, period=period.strip())
        if row is None:
            return {
                "provider_id": provider_id,
                "period": period.strip(),
                "total_requests": 0,
                "resolved_requests": 0,
                "canceled_requests": 0,
                "escalated_requests": 0,
                "avg_resolution_hours": 0.0,
            }
        return self._encode_metrics(row)

    @staticmethod
    def _encode_request(row: dict[str, Any]) -> dict[str, Any]:
        """Shape a DSL request row for API output."""
        return {
            "id": str(row.get("id") or ""),
            "dsl_kind": str(row.get("dsl_kind") or ""),
            "subject_type": str(row.get("subject_type") or ""),
            "subject_id": str(row.get("subject_id") or ""),
            "title": str(row.get("title") or ""),
            "dsl": row.get("dsl"),
            "status": str(row.get("status") or ""),
            "priority": str(row.get("priority") or ""),
            "reason": row.get("reason"),
            "requested_by": str(row.get("requested_by") or ""),
            "resolved_by": row.get("resolved_by"),
            "resolved_at": row.get("resolved_at"),
            "parent_id": row.get("parent_id"),
            "root_request_id": row.get("root_request_id"),
            "created_at": row.get("created_at"),
            "updated_at": row.get("updated_at"),
        }

    @staticmethod
    def _encode_log(row: dict[str, Any]) -> dict[str, Any]:
        """Shape an execution log row for API output."""
        return {
            "id": str(row.get("id") or ""),
            "step_order": int(row.get("step_order") or 0),
            "action": str(row.get("action") or ""),
            "status": str(row.get("status") or ""),
            "summary": row.get("summary"),
            "error": row.get("error"),
            "started_at": row.get("started_at"),
            "finished_at": row.get("finished_at"),
        }

    @staticmethod
    def _encode_metrics(row: dict[str, Any]) -> dict[str, Any]:
        """Shape a provider DSL metrics row for API output."""
        return {
            "provider_id": str(row.get("provider_id") or ""),
            "period": str(row.get("period") or ""),
            "total_requests": int(row.get("total_requests") or 0),
            "resolved_requests": int(row.get("resolved_requests") or 0),
            "canceled_requests": int(row.get("canceled_requests") or 0),
            "escalated_requests": int(row.get("escalated_requests") or 0),
            "avg_resolution_hours": float(row.get("avg_resolution_hours") or 0.0),
            "updated_at": row.get("updated_at"),
        }
