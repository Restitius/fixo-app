"""Notification definition: NTF-NTF-DIGEST."""
from __future__ import annotations

NOTIFICATION_KEY = "NTF-NTF-DIGEST"
CHANNELS: tuple[str, ...] = ("email")
TITLE_TEMPLATE = 'Your daily digest'
BODY_TEMPLATE = 'You have {unread_count} unread notifications.'
