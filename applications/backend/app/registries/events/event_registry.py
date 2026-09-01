"""Event Registry — maps event names (EVT-*) to domain event classes."""
from __future__ import annotations

from typing import TYPE_CHECKING

from app.shared.exceptions.hierarchy import ConfigurationError

if TYPE_CHECKING:  # pragma: no cover
    from app.events.event import DomainEvent


class EventRegistry:
    """Registers domain event classes under stable event names."""

    def __init__(self) -> None:
        self._events: dict[str, type["DomainEvent"]] = {}

    def register(self, event_name: str, event_cls: type["DomainEvent"], *, override: bool = False) -> None:
        if event_name in self._events and not override:
            raise ConfigurationError(
                f"Event already registered: {event_name}",
                code="REGISTRY.DUPLICATE_EVENT",
            )
        self._events[event_name] = event_cls

    def get(self, event_name: str) -> type["DomainEvent"]:
        try:
            return self._events[event_name]
        except KeyError:
            raise ConfigurationError(
                f"Event not registered: {event_name}",
                code="REGISTRY.UNKNOWN_EVENT",
            ) from None

    def exists(self, event_name: str) -> bool:
        return event_name in self._events

    def all_names(self) -> list[str]:
        return sorted(self._events)

    def count(self) -> int:
        return len(self._events)
