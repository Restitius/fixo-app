"""Email channel — delegates to the email integration (INT-EMAIL-001)."""
from __future__ import annotations


class EmailChannel:
    name = "email"
    integration_id = "INT-EMAIL-001"

    async def deliver(self, recipient_id: str, subject: str, body: str, meta: dict) -> bool:
        raise NotImplementedError("EmailChannel.deliver (via IntegrationManager)")
