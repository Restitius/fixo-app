"""Internal integrations — the cross-domain command bus.

Domains call each other through ports + internal integrations + the
command bus here, never by touching another domain's database directly.
Sibling package: app/integrations/external/ (third-party providers).
"""
from app.integrations.internal.manager import CommandManager
from app.integrations.internal.registry import CommandDefinition, CommandRegistry

__all__ = ["CommandManager", "CommandDefinition", "CommandRegistry"]
