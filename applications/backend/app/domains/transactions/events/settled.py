"""Domain event: EVT-TRX-SETTLED."""
from __future__ import annotations

from typing import Any

from app.events.event import DomainEvent, EventContext


class TransactionSettled(DomainEvent):
    """Emitted when a pending transaction settles."""

    EVENT_NAME = "EVT-TRX-SETTLED"

    def __init__(self, payload: dict[str, Any], context: EventContext | None = None) -> None:
        super().__init__(name=self.EVENT_NAME, payload=payload, context=context or EventContext())
