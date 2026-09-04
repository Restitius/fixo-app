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

    @staticmethod
    def visible_for_client(
        granted: frozenset[str] | set[str],
        screen: ScreenDefinition,
        client_id: str | None = None,
    ) -> bool:
        """Permission AND shell visibility — empty screen.clients = all shells."""
        if client_id is not None and screen.clients and client_id not in screen.clients:
            return False
        return ScreenPermissions.satisfies(granted, screen)
