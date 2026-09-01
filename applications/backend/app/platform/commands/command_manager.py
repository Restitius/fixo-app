"""CommandManager — platform facade over the command registry/bus."""
from __future__ import annotations

from typing import Any

from app.registries.commands.command_registry import CommandRegistry


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