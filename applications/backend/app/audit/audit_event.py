"""AuditEvent — who did what, when, from which screen, before/after values.

Audit is deliberately SEPARATE from logging (section 23): logging answers
'what happened inside the system'; audit answers 'who changed what'.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any

from app.shared.helpers.datetime_utils import iso_utc


@dataclass
class AuditEvent:
    actor_id: str
    action: str                      # e.g. 'asset.create', 'auth.login'
    resource_type: str               # e.g. 'asset'
    resource_id: str = ""
    screen_id: str = ""              # SCR-* when the action came from a UI
    before: dict[str, Any] | None = None
    after: dict[str, Any] | None = None
    ip_address: str = ""
    request_id: str = ""
    correlation_id: str = ""
    occurred_at: str = field(default_factory=iso_utc)

    def changed_fields(self) -> dict[str, tuple[Any, Any]]:
        """Compute {field: (before, after)} from before/after snapshots."""
        before = self.before or {}
        after = self.after or {}
        keys = set(before) | set(after)
        return {
            k: (before.get(k), after.get(k))
            for k in keys
            if before.get(k) != after.get(k)
        }
