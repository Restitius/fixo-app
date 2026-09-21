"""Domain event: EVT-AUTH-TOKEN-REFRESHED."""
from __future__ import annotations

from typing import Any

from app.events.event import DomainEvent, EventContext


class TokenRefreshed(DomainEvent):
    """Emitted when a refresh token rotates access."""

    EVENT_NAME = "EVT-AUTH-TOKEN-REFRESHED"

    def __init__(self, payload: dict[str, Any], context: EventContext | None = None) -> None:
        super().__init__(name=self.EVENT_NAME, payload=payload, context=context or EventContext())
