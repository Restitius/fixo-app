"""Messaging provider contract - transactional SMS + topic/stream publishing."""

from __future__ import annotations

from abc import abstractmethod
from typing import Any

from app.integrations.external.contracts.base_integration import BaseIntegration


class MessagingProvider(BaseIntegration):
    """Provider capable of both transactional SMS and topic/stream publishing.

    Transactional SMS is the operational path for FIXO notifications.
    Publishing is reserved for explicit event-bus-style use cases.
    """

    @abstractmethod
    async def send_sms(
        self,
        *,
        to: str,
        text: str,
        reference: str | None = None,
        notification_id: str | None = None,
    ) -> dict[str, Any]:
        """Send one transactional SMS and return provider delivery metadata.

        Return shape must include at least:
          - provider_message_uid
          - provider_request_uid
          - status
        """

    @abstractmethod
    async def publish(self, topic: str, payload: dict[str, Any], *, key: str | None = None) -> dict[str, Any]:
        """Publish a message to a topic/queue/exchange."""

    async def execute(self, operation: str, payload: dict[str, Any]) -> dict[str, Any]:
        """Dispatch to the correct messaging operation by name."""
        if operation == "send_sms":
            return await self.send_sms(
                to=payload["to"],
                text=payload["text"],
                reference=payload.get("reference"),
                notification_id=payload.get("notification_id"),
            )
        if operation == "publish":
            return await self.publish(
                topic=payload["topic"],
                payload=payload.get("payload", {}),
                key=payload.get("key"),
            )
        raise NotImplementedError(f"MessagingProvider operation={operation}")
