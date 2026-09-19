"""ServiceRequestRepository — persistence port for the request aggregate.

CUS.REQUEST.* IDs live only in ServiceRequestSqlAdapter.
"""
from __future__ import annotations

from typing import Any, Protocol, runtime_checkable


@runtime_checkable
class ServiceRequestRepository(Protocol):
    async def create(self, customer_id: str, params: dict[str, Any]) -> dict[str, Any] | None: ...
    async def get(self, customer_id: str, request_id: str) -> dict[str, Any] | None: ...
    async def list(
        self, customer_id: str, *, status: str | None = None,
        limit: int = 20, offset: int = 0
    ) -> list[dict[str, Any]]: ...
    async def update_draft(
        self, customer_id: str, request_id: str, params: dict[str, Any]
    ) -> dict[str, Any] | None: ...
    async def set_status(
        self, customer_id: str, request_id: str,
        *, from_state: str, to_state: str, notes: str | None = None
    ) -> dict[str, Any] | None: ...