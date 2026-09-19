"""Dashboard screens."""
from __future__ import annotations

from app.registries.screens.screen_definition import ScreenDefinition

SCREEN_DASHBOARD = ScreenDefinition(
    id="SCR-DASH-001",
    name="Main Dashboard",
    module="dashboard",
    route="/dashboard",
    permission="dashboard.view",
    description="Portfolio overview: net worth, recent activity, alerts.",
)

ALL: tuple[ScreenDefinition, ...] = (SCREEN_DASHBOARD,)
