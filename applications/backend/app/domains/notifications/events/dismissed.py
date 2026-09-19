"""Domain event: EVT-NTF-DISMISSED."""
from __future__ import annotations

from typing import Any

from app.events.event import DomainEvent, EventContext


class NotificationDismissed(DomainEvent):
    """Emitted when the recipient dismisses a notification."""

    EVENT_NAME = "EVT-NTF-DISMISSED"

    def __init__(self, payload: dict[str, Any], context: EventContext | None = None) -> None:
        super().__init__(name=self.EVENT_NAME, payload=payload, context=context or EventContext())
