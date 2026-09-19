"""Domain event: EVT-LIA-SETTLED."""
from __future__ import annotations

from typing import Any

from app.events.event import DomainEvent, EventContext


class LiabilitySettled(DomainEvent):
    """Emitted when the balance reaches zero."""

    EVENT_NAME = "EVT-LIA-SETTLED"

    def __init__(self, payload: dict[str, Any], context: EventContext | None = None) -> None:
        super().__init__(name=self.EVENT_NAME, payload=payload, context=context or EventContext())
