"""Domain event: EVT-NTF-ESCALATED."""
from __future__ import annotations

from typing import Any

from app.events.event import DomainEvent, EventContext


class NotificationEscalated(DomainEvent):
    """Emitted when escalation policy promotes severity."""

    EVENT_NAME = "EVT-NTF-ESCALATED"

    def __init__(self, payload: dict[str, Any], context: EventContext | None = None) -> None:
        super().__init__(name=self.EVENT_NAME, payload=payload, context=context or EventContext())
