"""Notification definition: NTF-LIA-PAYMENT-DUE."""
from __future__ import annotations

NOTIFICATION_KEY = "NTF-LIA-PAYMENT-DUE"
CHANNELS: tuple[str, ...] = ("database",)
TITLE_TEMPLATE = 'Payment due'
BODY_TEMPLATE = 'A payment of {amount} {currency} is due on {due_date}.'
