"""Notification definition: NTF.PAYMENT.AUTHORIZED.V1."""
from __future__ import annotations

NOTIFICATION_KEY = "NTF.PAYMENT.AUTHORIZED.V1"
CATEGORY = "PAYMENT_RECEIPTS"
RECIPIENTS: tuple[str, ...] = ("customer",)
CHANNELS: dict[str, tuple[str, ...]] = {
    "customer": ("database", "sms"),
}
REQUIRED_DATA: tuple[str, ...] = ("booking_id", "booking_number")
