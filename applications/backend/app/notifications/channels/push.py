"""Push channel — mobile/web push via provider integration."""
from __future__ import annotations


class PushChannel:
    name = "push"
    integration_id = "INT-PUSH-001"

    async def deliver(self, recipient_id: str, subject: str, body: str, meta: dict) -> bool:
        raise NotImplementedError("PushChannel.deliver")
