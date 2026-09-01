"""Screen permission helpers — decide whether a principal may open a screen."""
from __future__ import annotations

from app.registries.screens.screen_definition import ScreenDefinition


class ScreenPermissions:
    """Pure permission logic for screens (no IO)."""

    @staticmethod
    def required_permission(screen: ScreenDefinition) -> str:
        return screen.permission

    @staticmethod
    def satisfies(granted: frozenset[str] | set[str], screen: ScreenDefinition) -> bool:
        """True when 'granted' covers the screen's permission ('*' wildcard)."""
        if "*" in granted:
            return True
        return screen.permission in granted
