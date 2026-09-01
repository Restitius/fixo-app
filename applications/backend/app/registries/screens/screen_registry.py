"""Screen Registry — catalogue of registered screens (SCR-*)."""
from __future__ import annotations

from app.registries.screens.screen_definition import ScreenDefinition
from app.shared.exceptions.hierarchy import ConfigurationError


class ScreenRegistry:
    """Registers and resolves ScreenDefinition objects."""

    def __init__(self) -> None:
        self._screens: dict[str, ScreenDefinition] = {}

    def register(self, definition: ScreenDefinition, *, override: bool = False) -> None:
        if definition.id in self._screens and not override:
            raise ConfigurationError(
                f"Screen already registered: {definition.id}",
                code="REGISTRY.DUPLICATE_SCREEN",
            )
        self._screens[definition.id] = definition

    def get(self, screen_id: str) -> ScreenDefinition:
        try:
            return self._screens[screen_id]
        except KeyError:
            raise ConfigurationError(
                f"Screen not registered: {screen_id}",
                code="REGISTRY.UNKNOWN_SCREEN",
            ) from None

    def exists(self, screen_id: str) -> bool:
        return screen_id in self._screens

    def find_by_route(self, route: str) -> ScreenDefinition | None:
        for screen in self._screens.values():
            if screen.route == route:
                return screen
        return None

    def find_by_module(self, module: str) -> list[ScreenDefinition]:
        return sorted((s for s in self._screens.values() if s.module == module), key=lambda s: s.id)

    def all(self) -> list[ScreenDefinition]:
        return sorted(self._screens.values(), key=lambda s: s.id)

    def count(self) -> int:
        return len(self._screens)
