"""Settings screens."""
from __future__ import annotations

from app.registries.screens.screen_definition import ScreenDefinition

SCREEN_SETTINGS = ScreenDefinition(
    id="SCR-SET-001",
    name="Settings",
    module="settings",
    route="/settings",
    permission="settings.view",
    description="Profile, preferences, notification settings.",
)

ALL: tuple[ScreenDefinition, ...] = (SCREEN_SETTINGS,)
