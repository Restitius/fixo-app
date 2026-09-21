"""Domain event: EVT-USR-CREATED."""
from __future__ import annotations

from typing import Any

from app.events.event import DomainEvent, EventContext


class UserCreated(DomainEvent):
    """Emitted when an account is provisioned."""

    EVENT_NAME = "EVT-USR-CREATED"

    def __init__(self, payload: dict[str, Any], context: EventContext | None = None) -> None:
        super().__init__(name=self.EVENT_NAME, payload=payload, context=context or EventContext())
