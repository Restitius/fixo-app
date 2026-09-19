"""Notification definition: NTF.INVOICE.ISSUED.V1."""
from __future__ import annotations

NOTIFICATION_KEY = "NTF.INVOICE.ISSUED.V1"
CATEGORY = "PAYMENT_RECEIPTS"
RECIPIENTS: tuple[str, ...] = ("customer",)
CHANNELS: dict[str, tuple[str, ...]] = {
    "customer": ("database", "email"),
}
REQUIRED_DATA: tuple[str, ...] = ("invoice_id", "invoice_number", "total_amount", "currency")
