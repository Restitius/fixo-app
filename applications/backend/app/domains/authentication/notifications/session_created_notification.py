"""Notification definition: NTF-AUTH-NEW-DEVICE."""
from __future__ import annotations

NOTIFICATION_KEY = "NTF-AUTH-NEW-DEVICE"
CHANNELS: tuple[str, ...] = ("database", "email")
TITLE_TEMPLATE = 'New device sign-in'
BODY_TEMPLATE = 'A sign-in from {device} at {ip_address} was detected.'
