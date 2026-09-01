"""Domain event: EVT-USR-UPDATED."""
from __future__ import annotations

from typing import Any

from app.events.event import DomainEvent, EventContext


class UserUpdated(DomainEvent):
    """Emitted when profile fields change."""

    EVENT_NAME = "EVT-USR-UPDATED"

    def __init__(self, payload: dict[str, Any], context: EventContext | None = None) -> None:
        super().__init__(name=self.EVENT_NAME, payload=payload, context=context or EventContext())
