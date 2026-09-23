"""Notification definition: NTF-NTF-ALERT."""
from __future__ import annotations

NOTIFICATION_KEY = "NTF-NTF-ALERT"
CHANNELS: tuple[str, ...] = ("database",)
TITLE_TEMPLATE = '{title}'
BODY_TEMPLATE = '{body}'
