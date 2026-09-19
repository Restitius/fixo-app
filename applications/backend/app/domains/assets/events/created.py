"""Domain event: EVT-AST-CREATED."""
from __future__ import annotations

from typing import Any

from app.events.event import DomainEvent, EventContext


class AssetCreated(DomainEvent):
    """Emitted after a new asset row is committed."""

    EVENT_NAME = "EVT-AST-CREATED"

    def __init__(self, payload: dict[str, Any], context: EventContext | None = None) -> None:
        super().__init__(name=self.EVENT_NAME, payload=payload, context=context or EventContext())
