"""ScreenDefinition — a registered frontend screen (SCR-*).

Example (§9)::

    ScreenDefinition(
        id="SCR-AST-001",
        name="Assets List",
        module="assets",
        route="/assets",
        permission="assets.view",
    )
"""
from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class ScreenDefinition:
    """Immutable description of one frontend screen."""

    id: str           # e.g. SCR-AST-001
    name: str         # e.g. Assets List
    module: str       # owning domain/module, e.g. assets
    route: str        # frontend route, e.g. /assets
    permission: str   # required permission, e.g. assets.view
    description: str = ""
