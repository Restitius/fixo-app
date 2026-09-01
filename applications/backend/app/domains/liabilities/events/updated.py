"""Domain event: EVT-LIA-UPDATED."""
from __future__ import annotations

from typing import Any

from app.events.event import DomainEvent, EventContext


class LiabilityUpdated(DomainEvent):
    """Emitted when editable fields change."""

    EVENT_NAME = "EVT-LIA-UPDATED"

    def __init__(self, payload: dict[str, Any], context: EventContext | None = None) -> None:
        super().__init__(name=self.EVENT_NAME, payload=payload, context=context or EventContext())
