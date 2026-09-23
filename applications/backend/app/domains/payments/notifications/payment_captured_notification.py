"""Notification definition: NTF.PAYMENT.CAPTURED.V1."""
from __future__ import annotations

NOTIFICATION_KEY = "NTF.PAYMENT.CAPTURED.V1"
CATEGORY = "PAYMENT_RECEIPTS"
RECIPIENTS: tuple[str, ...] = ("customer",)
CHANNELS: dict[str, tuple[str, ...]] = {
    "customer": ("database", "sms"),
}
REQUIRED_DATA: tuple[str, ...] = ("booking_id", "booking_number")
