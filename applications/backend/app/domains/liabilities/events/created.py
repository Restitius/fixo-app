"""Domain event: EVT-LIA-CREATED."""
from __future__ import annotations

from typing import Any

from app.events.event import DomainEvent, EventContext


class LiabilityCreated(DomainEvent):
    """Emitted when a liability is opened."""

    EVENT_NAME = "EVT-LIA-CREATED"

    def __init__(self, payload: dict[str, Any], context: EventContext | None = None) -> None:
        super().__init__(name=self.EVENT_NAME, payload=payload, context=context or EventContext())
