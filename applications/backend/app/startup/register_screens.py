"""Screen registration — load SCR-* definitions into the ScreenRegistry."""
from __future__ import annotations

import logging
from typing import Any

logger = logging.getLogger(__name__)


def register_screens(screen_registry: Any) -> None:
    """Register every screen defined under app/screens/definitions."""
    from app.screens.definitions import assets as asset_screens
    from app.screens.definitions import dashboard as dashboard_screens
    from app.screens.definitions import liabilities as liability_screens
    from app.screens.definitions import settings as settings_screens
    from app.screens.definitions import transactions as transaction_screens

    modules = (
        dashboard_screens,
        asset_screens,
        transaction_screens,
        liability_screens,
        settings_screens,
    )
    for module in modules:
        for definition in getattr(module, "ALL", ()):
            screen_registry.register(definition)
    logger.info("screen registry loaded: %s screens", screen_registry.count())
