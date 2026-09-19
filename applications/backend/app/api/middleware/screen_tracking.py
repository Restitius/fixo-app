"""ScreenTrackingMiddleware — resolve X-Screen-ID into request state.

Flow (section 10):

    Request(X-Screen-ID) --> here --> ScreenTracker --> ScreenContext
                         --> request.state.screen_context + log binding
"""
from __future__ import annotations

from functools import lru_cache

from app.logging.context import bind
from app.registries.screens.screen_registry import ScreenRegistry
from app.screens.tracker import ScreenTracker
from app.shared.constants.headers import HEADER_SCREEN_ID


@lru_cache(maxsize=1)
def _default_screen_registry() -> ScreenRegistry:
    """Standalone registry populated from definitions (bootstrap shares it)."""
    from app.startup.register_screens import register_screens

    registry = ScreenRegistry()
    register_screens(registry)
    return registry


class ScreenTrackingMiddleware:
    def __init__(self, app) -> None:  # type: ignore[no-untyped-def]
        self.app = app

    async def __call__(self, scope, receive, send) -> None:  # type: ignore[no-untyped-def]
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        screen_id = ""
        for raw_key, raw_value in scope.get("headers", []):
            if raw_key.decode("latin-1").lower() == HEADER_SCREEN_ID.lower():
                screen_id = raw_value.decode("latin-1")
                break

        tracker = ScreenTracker(_default_screen_registry())
        screen_context = tracker.resolve(screen_id or None)
        if screen_context is not None:
            bind(screen_id=screen_context.screen_id)
        scope.setdefault("state", {})["screen_context"] = screen_context

        await self.app(scope, receive, send)
