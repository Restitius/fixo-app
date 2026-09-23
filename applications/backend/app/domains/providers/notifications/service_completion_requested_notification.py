"""Notification definition: NTF.SERVICE.COMPLETION_REQUESTED.V1.

Emitted by the provider domain (provider marks the job complete) but the
recipient is the customer, who must review and confirm.
"""
from __future__ import annotations

NOTIFICATION_KEY = "NTF.SERVICE.COMPLETION_REQUESTED.V1"
CATEGORY = "BOOKING_UPDATES"
RECIPIENTS: tuple[str, ...] = ("customer",)
CHANNELS: dict[str, tuple[str, ...]] = {
    "customer": ("database", "sms"),
}
REQUIRED_DATA: tuple[str, ...] = ("booking_id", "booking_number")
