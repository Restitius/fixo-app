"""Domain event: EVT-TRX-CREATED."""
from __future__ import annotations

from typing import Any

from app.events.event import DomainEvent, EventContext


class TransactionCreated(DomainEvent):
    """Emitted when a transaction is recorded."""

    EVENT_NAME = "EVT-TRX-CREATED"

    def __init__(self, payload: dict[str, Any], context: EventContext | None = None) -> None:
        super().__init__(name=self.EVENT_NAME, payload=payload, context=context or EventContext())
