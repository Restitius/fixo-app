"""InProcessEventBus — default EventBus implementation.

Dispatches domain events to listeners registered in the ListenerRegistry.
Error isolation: one failing listener never blocks the others; failures are
logged and surfaced in the returned per-listener status.
"""
from __future__ import annotations

import asyncio
import inspect
import logging
from typing import Any

from app.registries.events.listener_registry import ListenerRegistry

logger = logging.getLogger(__name__)


class InProcessEventBus:
    """Publish events -> run bound listeners (async-aware, fault-isolated)."""

    def __init__(self, listeners: ListenerRegistry | None = None) -> None:
        self._listeners = listeners or ListenerRegistry()

    @property
    def listener_registry(self) -> ListenerRegistry:
        return self._listeners

    def subscribe(self, event_name: str, handler: Any, *, priority: int = 0) -> None:
        self._listeners.register_listener(event_name, handler, priority=priority)

    async def publish(self, event: Any) -> dict[str, str]:
        """Run every listener bound to event.name; returns name->ok|error map."""
        outcomes: dict[str, str] = {}
        for listener in self._listeners.listeners_for(getattr(event, "name", "")):
            label = getattr(listener, "__qualname__", repr(listener))
            try:
                result = listener(event)
                if inspect.isawaitable(result):
                    await result
                outcomes[label] = "ok"
            except Exception:  # noqa: BLE001 - isolation is intentional
                logger.exception("listener failed for event %s", getattr(event, "name", "?"))
                outcomes[label] = "error"
        return outcomes
