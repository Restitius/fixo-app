"""Notification definition: NTF-USR-SECURITY-ALERT."""
from __future__ import annotations

NOTIFICATION_KEY = "NTF-USR-SECURITY-ALERT"
CHANNELS: tuple[str, ...] = ("database", "email", "sms")
TITLE_TEMPLATE = 'Security alert'
BODY_TEMPLATE = 'A sensitive change occurred on your account from {ip_address}.'
