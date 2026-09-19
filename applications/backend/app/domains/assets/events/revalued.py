"""Domain event: EVT-AST-REVALUED."""
from __future__ import annotations

from typing import Any

from app.events.event import DomainEvent, EventContext


class AssetRevalued(DomainEvent):
    """Emitted when a new valuation is recorded."""

    EVENT_NAME = "EVT-AST-REVALUED"

    def __init__(self, payload: dict[str, Any], context: EventContext | None = None) -> None:
        super().__init__(name=self.EVENT_NAME, payload=payload, context=context or EventContext())
