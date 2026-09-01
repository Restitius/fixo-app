"""EventBus composition root — wires dispatcher + registries + transports.

The HTTP path publishes in-process; the messaging adapters (Kafka/RabbitMQ)
mirror selected events outward once implemented.
"""
from __future__ import annotations

from app.events.dispatcher import EventDispatcher
from app.registries.events.event_registry import EventRegistry
from app.registries.events.listener_registry import ListenerRegistry


class EventBus:
    """Facade combining event catalogue + listener bindings + dispatching."""

    def __init__(
        self,
        events: EventRegistry | None = None,
        listeners: ListenerRegistry | None = None,
    ) -> None:
        self.events = events or EventRegistry()
        self.listeners = listeners or ListenerRegistry()
        self.dispatcher = EventDispatcher(self.listeners)

    async def publish(self, event: Any) -> dict[str, str]:
        return await self.dispatcher.dispatch(event)

    def subscribe(self, event_name: str, handler: Any, *, priority: int = 0) -> None:
        self.listeners.register_listener(event_name, handler, priority=priority)
