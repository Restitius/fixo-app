"""Notification definition: NTF-AUTH-PASSWORD-CHANGED."""
from __future__ import annotations

NOTIFICATION_KEY = "NTF-AUTH-PASSWORD-CHANGED"
CHANNELS: tuple[str, ...] = ("database", "email")
TITLE_TEMPLATE = 'Password changed'
BODY_TEMPLATE = 'Your password was changed. If this was not you, reset it immediately.'
