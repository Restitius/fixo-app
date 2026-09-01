"""Domain event: EVT-TRX-CATEGORIZED."""
from __future__ import annotations

from typing import Any

from app.events.event import DomainEvent, EventContext


class TransactionCategorized(DomainEvent):
    """Emitted when category assignment changes."""

    EVENT_NAME = "EVT-TRX-CATEGORIZED"

    def __init__(self, payload: dict[str, Any], context: EventContext | None = None) -> None:
        super().__init__(name=self.EVENT_NAME, payload=payload, context=context or EventContext())
