"""CommandManager — internal integrations: the cross-domain command bus.

Domains call each other through ports + internal integrations + this
command bus, never by touching another domain's database directly
(architecture rule: "Cross-domain calls... go through ports + internal
integrations + command bus").
"""
from __future__ import annotations

from typing import Any

from app.integrations.internal.registry import CommandRegistry


class CommandManager:
    """Resolves and dispatches registered commands (CLI/internal)."""

    def __init__(self, registry: CommandRegistry | None = None) -> None:
        self._registry = registry or CommandRegistry()

    @property
    def registry(self) -> CommandRegistry:
        return self._registry

    async def dispatch(self, command_id: str, payload: dict[str, Any] | None = None) -> Any:
        """Resolve a registered command and run it (scaffold until handlers land)."""
        self._registry.get(command_id)
        raise NotImplementedError("CommandManager.dispatch — wire handler resolution")