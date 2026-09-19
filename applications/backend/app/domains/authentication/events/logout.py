"""Domain event: EVT-AUTH-LOGOUT."""
from __future__ import annotations

from typing import Any

from app.events.event import DomainEvent, EventContext


class LogoutPerformed(DomainEvent):
    """Emitted when a session ends."""

    EVENT_NAME = "EVT-AUTH-LOGOUT"

    def __init__(self, payload: dict[str, Any], context: EventContext | None = None) -> None:
        super().__init__(name=self.EVENT_NAME, payload=payload, context=context or EventContext())
