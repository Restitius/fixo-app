"""ScreenTracker — resolves X-Screen-ID header into a ScreenContext.

Flow (architecture section 10):

    Request(X-Screen-ID) --> ScreenTrackingMiddleware --> ScreenTracker
                         --> ScreenRegistry lookup --> RequestContext/log binding
"""
from __future__ import annotations

import logging

from app.registries.screens.screen_definition import ScreenDefinition
from app.registries.screens.screen_registry import ScreenRegistry
from app.screens.context import ScreenContext

logger = logging.getLogger(__name__)


class ScreenTracker:
    def __init__(self, screens: ScreenRegistry) -> None:
        self._screens = screens

    def resolve(self, screen_id: str | None) -> ScreenContext | None:
        """Resolve a screen id; unknown ids log a warning and yield None."""
        if not screen_id:
            return None
        if not self._screens.exists(screen_id):
            logger.warning("Unknown screen id presented: %s", screen_id)
            return None
        definition: ScreenDefinition = self._screens.get(screen_id)
        return ScreenContext(
            screen_id=definition.id,
            name=definition.name,
            module=definition.module,
            route=definition.route,
            permission=definition.permission,
        )
