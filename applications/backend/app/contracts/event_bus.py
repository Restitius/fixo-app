"""Event bus contract — how services emit events without knowing transports."""
from __future__ import annotations

from typing import Any, Protocol, runtime_checkable


@runtime_checkable
class EventBus(Protocol):
    """Minimal publish/subscribe surface for domain events."""

    async def publish(self, event: Any) -> None:
        """Publish a domain event to all subscribed handlers."""
        ...

    def subscribe(self, event_name: str, handler: Any) -> None:
        """Subscribe a handler to an event name."""
        ...
