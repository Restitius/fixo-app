"""Notification definition: NTF-LIA-CREATED."""
from __future__ import annotations

NOTIFICATION_KEY = "NTF-LIA-CREATED"
CHANNELS: tuple[str, ...] = ("database",)
TITLE_TEMPLATE = 'Liability added'
BODY_TEMPLATE = 'A new liability with {lender} was recorded.'
