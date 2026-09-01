"""Notification definition: NTF-AST-CREATED."""
from __future__ import annotations

NOTIFICATION_KEY = "NTF-AST-CREATED"
CHANNELS: tuple[str, ...] = ("database", "email")
TITLE_TEMPLATE = 'Asset created'
BODY_TEMPLATE = 'Your asset "{name}" was added to your portfolio.'
