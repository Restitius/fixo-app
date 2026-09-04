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
        """Dispatch an event, auto-filling missing context from the request log snapshot.

        Services may emit events without an explicit EventContext; the bus
        back-fills request_id/correlation_id/screen_id/client_id/etc. from the
        current logging context so every event carries full shell attribution
        without touching a single domain file.
        """
        from app.events.event import EventContext
        from app.logging.context import current as current_log_context

        snapshot = current_log_context()
        ctx = event.context
        event.context = EventContext(
            request_id=ctx.request_id or snapshot.get("request_id", ""),
            correlation_id=ctx.correlation_id or snapshot.get("correlation_id", ""),
            user_id=ctx.user_id or snapshot.get("user_id", ""),
            session_id=ctx.session_id or snapshot.get("session_id", ""),
            screen_id=ctx.screen_id or snapshot.get("screen_id", ""),
            tenant_id=ctx.tenant_id or snapshot.get("tenant_id", ""),
            client_id=ctx.client_id or snapshot.get("client_id", ""),
            client_version=ctx.client_version or snapshot.get("client_version", ""),
        )
        return await self.dispatcher.dispatch(event)

    def subscribe(self, event_name: str, handler: Any, *, priority: int = 0) -> None:
        self.listeners.register_listener(event_name, handler, priority=priority)
