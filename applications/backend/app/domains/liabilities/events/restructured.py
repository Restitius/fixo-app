"""Domain event: EVT-LIA-RESTRUCTURED."""
from __future__ import annotations

from typing import Any

from app.events.event import DomainEvent, EventContext


class LiabilityRestructured(DomainEvent):
    """Emitted when terms (rate/term) change."""

    EVENT_NAME = "EVT-LIA-RESTRUCTURED"

    def __init__(self, payload: dict[str, Any], context: EventContext | None = None) -> None:
        super().__init__(name=self.EVENT_NAME, payload=payload, context=context or EventContext())
