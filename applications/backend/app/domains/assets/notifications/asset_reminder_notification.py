"""Notification definition: NTF-AST-REMINDER."""
from __future__ import annotations

NOTIFICATION_KEY = "NTF-AST-REMINDER"
CHANNELS: tuple[str, ...] = ("database", "push")
TITLE_TEMPLATE = 'Asset review due'
BODY_TEMPLATE = 'Assets like "{name}" are due for a valuation review.'
