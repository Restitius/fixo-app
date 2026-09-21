"""Domain event: EVT-USR-DEACTIVATED."""
from __future__ import annotations

from typing import Any

from app.events.event import DomainEvent, EventContext


class UserDeactivated(DomainEvent):
    """Emitted when an account is deactivated."""

    EVENT_NAME = "EVT-USR-DEACTIVATED"

    def __init__(self, payload: dict[str, Any], context: EventContext | None = None) -> None:
        super().__init__(name=self.EVENT_NAME, payload=payload, context=context or EventContext())
