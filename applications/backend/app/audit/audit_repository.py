"""AuditRepository — persistence for audit events (AUDIT_DB target)."""
from __future__ import annotations

from app.audit.audit_event import AuditEvent


class AuditRepository:
    async def record(self, event: AuditEvent) -> str:
        """Persist one audit event; return its audit id."""
        raise NotImplementedError("AuditRepository.record (QRY AUDIT.*)")

    async def query(
        self,
        *,
        actor_id: str | None = None,
        resource_type: str | None = None,
        resource_id: str | None = None,
        limit: int = 50,
    ) -> list[AuditEvent]:
        raise NotImplementedError("AuditRepository.query")
