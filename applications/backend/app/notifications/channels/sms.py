"""SMS channel — delegates to the SMS integration (INT-SMS-001)."""
from __future__ import annotations


class SmsChannel:
    name = "sms"
    integration_id = "INT-SMS-001"

    async def deliver(self, recipient_id: str, subject: str, body: str, meta: dict) -> bool:
        raise NotImplementedError("SmsChannel.deliver (via IntegrationManager)")
