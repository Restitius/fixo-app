"""Domain event: EVT-AUTH-LOGIN-SUCCEEDED."""
from __future__ import annotations

from typing import Any

from app.events.event import DomainEvent, EventContext


class LoginSucceeded(DomainEvent):
    """Emitted after successful credential verification."""

    EVENT_NAME = "EVT-AUTH-LOGIN-SUCCEEDED"

    def __init__(self, payload: dict[str, Any], context: EventContext | None = None) -> None:
        super().__init__(name=self.EVENT_NAME, payload=payload, context=context or EventContext())
