"""Notification definition: NTF-USR-WELCOME."""
from __future__ import annotations

NOTIFICATION_KEY = "NTF-USR-WELCOME"
CHANNELS: tuple[str, ...] = ("database", "email")
TITLE_TEMPLATE = 'Welcome to FIXO-APP'
BODY_TEMPLATE = 'Hi {username}, your account is ready.'
