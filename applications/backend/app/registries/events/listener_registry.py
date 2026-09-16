"""Listener Registry — event name to ordered listener bindings.

Listeners are the ONLY place side effects happen (§17): activity writes,
notifications, analytics, Kafka publishing, etc.
"""
from __future__ import annotations

import itertools
from collections.abc import Callable
from typing import Any

from app.shared.exceptions.hierarchy import ConfigurationError

ListenerCallable = Callable[[Any], Any]


class ListenerRegistry:
    """Registers listeners per event name with optional priority ordering."""

    def __init__(self) -> None:
        self._bindings: dict[str, list[tuple[int, int, ListenerCallable]]] = {}
        self._seq = itertools.count()

    def register_listener(
        self,
        event_name: str,
        listener: ListenerCallable,
        *,
        priority: int = 0,
    ) -> None:
        """Bind a listener to an event name (higher priority runs first)."""
        self._bindings.setdefault(event_name, []).append((priority, next(self._seq), listener))

    def listeners_for(self, event_name: str) -> list[ListenerCallable]:
        """Listeners bound to an event, ordered by priority then registration."""
        ordered = sorted(self._bindings.get(event_name, ()), key=lambda b: (-b[0], b[1]))
        return [listener for _, _, listener in ordered]

    def event_names(self) -> list[str]:
        return sorted(self._bindings)

    def unregister_event(self, event_name: str) -> None:
        if event_name not in self._bindings:
            raise ConfigurationError(
                f"No listeners bound for event: {event_name}",
                code="REGISTRY.UNKNOWN_LISTENERS",
            )
        del self._bindings[event_name]

    def count(self) -> int:
        return sum(len(bindings) for bindings in self._bindings.values())
