"""AuditService — application-facing audit API + diff helper."""
from __future__ import annotations

from typing import Any

from app.audit.audit_event import AuditEvent
from app.audit.audit_repository import AuditRepository


class AuditService:
    def __init__(self, repository: AuditRepository) -> None:
        self._repository = repository

    async def record(self, event: AuditEvent) -> str:
        return await self._repository.record(event)

    async def record_change(
        self,
        *,
        actor_id: str,
        action: str,
        resource_type: str,
        resource_id: str,
        before: dict[str, Any] | None,
        after: dict[str, Any] | None,
        screen_id: str = "",
        request_id: str = "",
        correlation_id: str = "",
        ip_address: str = "",
    ) -> str:
        """Convenience wrapper building an AuditEvent from kwargs."""
        event = AuditEvent(
            actor_id=actor_id,
            action=action,
            resource_type=resource_type,
            resource_id=resource_id,
            before=before,
            after=after,
            screen_id=screen_id,
            request_id=request_id,
            correlation_id=correlation_id,
            ip_address=ip_address,
        )
        return await self.record(event)
