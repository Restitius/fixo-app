"""Platform events package — facade over the event bus/dispatcher."""
from app.events.event_bus import EventBus as RegisteredEventPublisher

__all__ = ["RegisteredEventPublisher"]