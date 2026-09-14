"""CommandRegistry — internal integrations: registered command names to
handlers/metadata. Backs both the cross-domain command bus
(CommandManager, app/integrations/internal/manager.py) and the
management CLI (app/commands/cli.py)."""
from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Callable

from app.shared.exceptions.hierarchy import ConfigurationError

CommandHandler = Callable[..., Any]


@dataclass(frozen=True)
class CommandDefinition:
    """Metadata describing one CLI command."""

    name: str
    handler: CommandHandler
    group: str = "general"
    help_text: str = ""
    aliases: tuple[str, ...] = field(default_factory=tuple)


class CommandRegistry:
    """Registers CLI commands, optionally grouped (database|maintenance|domains)."""

    def __init__(self) -> None:
        self._commands: dict[str, CommandDefinition] = {}

    def register(self, definition: CommandDefinition, *, override: bool = False) -> None:
        if definition.name in self._commands and not override:
            raise ConfigurationError(
                f"Command already registered: {definition.name}",
                code="REGISTRY.DUPLICATE_COMMAND",
            )
        self._commands[definition.name] = definition

    def get(self, name: str) -> CommandDefinition:
        try:
            return self._commands[name]
        except KeyError:
            raise ConfigurationError(
                f"Command not registered: {name}",
                code="REGISTRY.UNKNOWN_COMMAND",
            ) from None

    def by_group(self, group: str) -> list[CommandDefinition]:
        return sorted((c for c in self._commands.values() if c.group == group), key=lambda c: c.name)

    def all(self) -> list[CommandDefinition]:
        return sorted(self._commands.values(), key=lambda c: c.name)

    def count(self) -> int:
        return len(self._commands)
