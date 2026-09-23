"""Notification definition: NTF.BOOKING.CONFIRMED.V1."""

from __future__ import annotations

NOTIFICATION_KEY = "NTF.BOOKING.CONFIRMED.V1"
CATEGORY = "BOOKING_UPDATES"
RECIPIENTS: tuple[str, ...] = ("customer", "provider")
CHANNELS: dict[str, tuple[str, ...]] = {
    "customer": ("database", "sms"),
    "provider": ("database", "sms"),
}
REQUIRED_DATA: tuple[str, ...] = ("booking_id", "booking_number")
