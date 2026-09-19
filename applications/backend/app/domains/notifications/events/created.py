"""Domain event: EVT-NTF-CREATED."""
from __future__ import annotations

from typing import Any

from app.events.event import DomainEvent, EventContext


class NotificationCreated(DomainEvent):
    """Emitted when a persistent notification row is written."""

    EVENT_NAME = "EVT-NTF-CREATED"

    def __init__(self, payload: dict[str, Any], context: EventContext | None = None) -> None:
        super().__init__(name=self.EVENT_NAME, payload=payload, context=context or EventContext())
