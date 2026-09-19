"""Notification definition: NTF-TRX-CREATED."""
from __future__ import annotations

NOTIFICATION_KEY = "NTF-TRX-CREATED"
CHANNELS: tuple[str, ...] = ("database",)
TITLE_TEMPLATE = 'Transaction recorded'
BODY_TEMPLATE = 'A new transaction of {amount} {currency} was recorded.'
