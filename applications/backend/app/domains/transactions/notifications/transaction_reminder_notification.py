"""Notification definition: NTF-TRX-REMINDER."""
from __future__ import annotations

NOTIFICATION_KEY = "NTF-TRX-REMINDER"
CHANNELS: tuple[str, ...] = ("database",)
TITLE_TEMPLATE = 'Unsettled transactions'
BODY_TEMPLATE = 'You have {count} unsettled transactions awaiting review.'
