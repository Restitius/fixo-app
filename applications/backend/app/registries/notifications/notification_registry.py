"""Notification Registry — notification keys (NTF-*) to definitions."""
from __future__ import annotations

from typing import Any

from app.shared.exceptions.hierarchy import ConfigurationError


class NotificationRegistry:
    """Registers notification definitions under stable keys."""

    def __init__(self) -> None:
        self._notifications: dict[str, Any] = {}

    def register(self, key: str, definition: Any, *, override: bool = False) -> None:
        if key in self._notifications and not override:
            raise ConfigurationError(
                f"Notification already registered: {key}",
                code="REGISTRY.DUPLICATE_NOTIFICATION",
            )
        self._notifications[key] = definition

    def get(self, key: str) -> Any:
        try:
            return self._notifications[key]
        except KeyError:
            raise ConfigurationError(
                f"Notification not registered: {key}",
                code="REGISTRY.UNKNOWN_NOTIFICATION",
            ) from None

    def exists(self, key: str) -> bool:
        return key in self._notifications

    def all_keys(self) -> list[str]:
        return sorted(self._notifications)

    def count(self) -> int:
        return len(self._notifications)
