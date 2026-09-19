"""Domain event: EVT-USR-PASSWORD-CHANGED."""
from __future__ import annotations

from typing import Any

from app.events.event import DomainEvent, EventContext


class PasswordChanged(DomainEvent):
    """Emitted after a successful password change."""

    EVENT_NAME = "EVT-USR-PASSWORD-CHANGED"

    def __init__(self, payload: dict[str, Any], context: EventContext | None = None) -> None:
        super().__init__(name=self.EVENT_NAME, payload=payload, context=context or EventContext())
