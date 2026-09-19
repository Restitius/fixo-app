"""Domain event: EVT-AUTH-LOGIN-FAILED."""
from __future__ import annotations

from typing import Any

from app.events.event import DomainEvent, EventContext


class LoginFailed(DomainEvent):
    """Emitted when verification fails (feeds lockout)."""

    EVENT_NAME = "EVT-AUTH-LOGIN-FAILED"

    def __init__(self, payload: dict[str, Any], context: EventContext | None = None) -> None:
        super().__init__(name=self.EVENT_NAME, payload=payload, context=context or EventContext())
