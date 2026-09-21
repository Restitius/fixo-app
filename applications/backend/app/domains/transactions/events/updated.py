"""Domain event: EVT-TRX-UPDATED."""
from __future__ import annotations

from typing import Any

from app.events.event import DomainEvent, EventContext


class TransactionUpdated(DomainEvent):
    """Emitted when editable fields change."""

    EVENT_NAME = "EVT-TRX-UPDATED"

    def __init__(self, payload: dict[str, Any], context: EventContext | None = None) -> None:
        super().__init__(name=self.EVENT_NAME, payload=payload, context=context or EventContext())
