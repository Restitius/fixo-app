"""EventDispatcher — resolves listeners for an event and executes them.

Flow (architecture section 16):

    Service emits DomainEvent --> EventDispatcher --> ListenerRegistry
                              --> listeners (activity, notifications, kafka...)
"""
from __future__ import annotations

import inspect
from typing import Any

from app.events.event import DomainEvent
from app.registries.events.listener_registry import ListenerRegistry


class EventDispatcher:
    """Sequential, fault-isolated listener execution."""

    def __init__(self, listeners: ListenerRegistry) -> None:
        self._listeners = listeners

    async def dispatch(self, event: DomainEvent) -> dict[str, str]:
        """Run all listeners bound to the event name; return name->outcome map."""
        outcomes: dict[str, str] = {}
        for listener in self._listeners.listeners_for(event.name):
            label = getattr(listener, "__qualname__", repr(listener))
            try:
                result = listener(event)
                if inspect.isawaitable(result):
                    await result
                outcomes[label] = "ok"
            except Exception:  # noqa: BLE001 - isolation is intentional
                outcomes[label] = "error"
        return outcomes
