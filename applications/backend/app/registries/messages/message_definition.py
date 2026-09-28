"""Typed definition for one stable, client-facing system message.

The dataclass lives in the shared kernel so domain catalogues can declare messages
without importing the registry layer; it is re-exported here for registry code.
"""

from __future__ import annotations

from app.shared.messages.definition import MessageDefinition

__all__ = ["MessageDefinition"]
