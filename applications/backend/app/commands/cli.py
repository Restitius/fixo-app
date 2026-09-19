"""FIXO-APP management CLI (stdlib argparse; Typer-swappable later).

Usage::

    python -m app.commands.cli <group> <command> [options]

Groups: database | maintenance | domains | jobs | system
Commands are discovered from the CommandRegistry populated by startup.
"""
from __future__ import annotations

import argparse
from collections.abc import Sequence

from app.integrations.internal.registry import CommandDefinition, CommandRegistry


def build_default_registry() -> CommandRegistry:
    """CLI-local registry seeded with scaffold commands."""
    registry = CommandRegistry()

    def _not_implemented(name: str):
        def handler(args: argparse.Namespace) -> int:
            raise NotImplementedError(f"Command not implemented yet: {name}")
        return handler

    seeds = [
        CommandDefinition("database.status", _not_implemented("database.status"), group="database", help_text="Show migration status"),
        CommandDefinition("database.seed", _not_implemented("database.seed"), group="database", help_text="Load seed data"),
        CommandDefinition("maintenance.prune-logs", _not_implemented("maintenance.prune-logs"), group="maintenance", help_text="Prune old log folders"),
        CommandDefinition("maintenance.purge-temp", _not_implemented("maintenance.purge-temp"), group="maintenance", help_text="Purge storage/temporary"),
        CommandDefinition("domains.refresh-asset-values", _not_implemented("domains.refresh-asset-values"), group="domains", help_text="Trigger asset revaluation job"),
        CommandDefinition("system.registries", _not_implemented("system.registries"), group="system", help_text="Print registry summary"),
    ]
    for definition in seeds:
        registry.register(definition)
    return registry


def build_parser(registry: CommandRegistry | None = None) -> argparse.ArgumentParser:
    registry = registry or build_default_registry()
    parser = argparse.ArgumentParser(prog="fixo", description="FIXO-APP management CLI")
    sub = parser.add_subparsers(dest="command", required=True)
    for definition in registry.all():
        cmd = sub.add_parser(definition.name, help=definition.help_text)
        cmd.set_defaults(_handler=definition.handler)
    return parser


def main(argv: Sequence[str] | None = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)
    handler = args._handler
    return int(handler(args) or 0)


if __name__ == "__main__":
    raise SystemExit(main())
