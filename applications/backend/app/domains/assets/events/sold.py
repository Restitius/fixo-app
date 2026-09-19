"""Domain event: EVT-AST-SOLD."""
from __future__ import annotations

from typing import Any

from app.events.event import DomainEvent, EventContext


class AssetSold(DomainEvent):
    """Emitted when an asset transitions to SOLD."""

    EVENT_NAME = "EVT-AST-SOLD"

    def __init__(self, payload: dict[str, Any], context: EventContext | None = None) -> None:
        super().__init__(name=self.EVENT_NAME, payload=payload, context=context or EventContext())
