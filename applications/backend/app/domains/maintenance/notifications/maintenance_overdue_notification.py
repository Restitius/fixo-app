"""Notification definition: NTF.MAINTENANCE.OVERDUE.V1."""
from __future__ import annotations

NOTIFICATION_KEY = "NTF.MAINTENANCE.OVERDUE.V1"
CATEGORY = "BOOKING_UPDATES"
RECIPIENTS: tuple[str, ...] = ("customer",)
CHANNELS: dict[str, tuple[str, ...]] = {
    "customer": ("database",),
}
REQUIRED_DATA: tuple[str, ...] = ("plan_id", "plan_number")
