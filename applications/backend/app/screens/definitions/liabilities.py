"""Liabilities module screens."""
from __future__ import annotations

from app.registries.screens.screen_definition import ScreenDefinition

SCREEN_LIABILITIES_LIST = ScreenDefinition(
    id="SCR-LIA-001",
    name="Liabilities List",
    module="liabilities",
    route="/liabilities",
    permission="liabilities.view",
    description="Outstanding debts with repayment progress indicators.",
)

ALL: tuple[ScreenDefinition, ...] = (SCREEN_LIABILITIES_LIST,)
