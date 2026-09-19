"""Assets module screens."""
from __future__ import annotations

from app.registries.screens.screen_definition import ScreenDefinition

SCREEN_ASSETS_LIST = ScreenDefinition(
    id="SCR-AST-001",
    name="Assets List",
    module="assets",
    route="/assets",
    permission="assets.view",
    description="Paginated asset portfolio with filters and summary bar.",
)

SCREEN_ASSET_DETAIL = ScreenDefinition(
    id="SCR-AST-002",
    name="Asset Detail",
    module="assets",
    route="/assets/:asset_id",
    permission="assets.view",
    description="Single asset view: valuation history, actions (sell/revalue/archive).",
)

ALL: tuple[ScreenDefinition, ...] = (SCREEN_ASSETS_LIST, SCREEN_ASSET_DETAIL)
