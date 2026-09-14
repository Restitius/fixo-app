"""Notification definition: NTF.SERVICE.COMPLETED.V1."""
from __future__ import annotations

NOTIFICATION_KEY = "NTF.SERVICE.COMPLETED.V1"
CATEGORY = "BOOKING_UPDATES"
RECIPIENTS: tuple[str, ...] = ("customer",)
CHANNELS: dict[str, tuple[str, ...]] = {
    "customer": ("database", "email"),
}
REQUIRED_DATA: tuple[str, ...] = ("booking_id", "booking_number")
