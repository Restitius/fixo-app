"""AuditGateway — who-changed-what capability (separate from logs)."""
from __future__ import annotations

from typing import Any, Protocol, runtime_checkable


@runtime_checkable
class AuditGateway(Protocol):
    """Record an audit trail entry for a business action."""

    async def record(self, *, action: str, entity_type: str, entity_id: str | None, actor_id: str | None, old: dict[str, Any] | None = None, new: dict[str, Any] | None = None, source: str | None = None) -> None: ...