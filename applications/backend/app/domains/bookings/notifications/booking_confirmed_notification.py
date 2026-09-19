"""Notification definition: NTF.BOOKING.CONFIRMED.V1."""
from __future__ import annotations

NOTIFICATION_KEY = "NTF.BOOKING.CONFIRMED.V1"
CATEGORY = "BOOKING_UPDATES"
RECIPIENTS: tuple[str, ...] = ("customer", "assigned_provider")
CHANNELS: dict[str, tuple[str, ...]] = {
    "customer": ("database", "email"),
    "assigned_provider": ("database",),
}
REQUIRED_DATA: tuple[str, ...] = ("booking_id", "booking_number")
