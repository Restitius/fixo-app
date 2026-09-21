"""Domain event: EVT-NTF-READ."""
from __future__ import annotations

from typing import Any

from app.events.event import DomainEvent, EventContext


class NotificationRead(DomainEvent):
    """Emitted when the recipient reads a notification."""

    EVENT_NAME = "EVT-NTF-READ"

    def __init__(self, payload: dict[str, Any], context: EventContext | None = None) -> None:
        super().__init__(name=self.EVENT_NAME, payload=payload, context=context or EventContext())
