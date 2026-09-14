"""MessagingIntegrationAdapter — implements SMS/Email gateway ports.

    Domain -> SmsGateway/EmailGateway (ports) -> this adapter
           -> IntegrationManager -> INT.SMS.* / INT.EMAIL.*
"""
from __future__ import annotations

from typing import Any

from app.integrations.external.manager import IntegrationManager


class MessagingGatewayIntegrationIds:
    """Stable INT-* IDs for messaging operations (adapter-private)."""

    SMS_TRANSACTIONAL = "INT.SMS.TRANSACTIONAL.V1"
    EMAIL_TRANSACTIONAL = "INT.EMAIL.TRANSACTIONAL.V1"


class MessagingIntegrationAdapter:
    """Provider-agnostic SMS/email surface backed by the integration manager."""

    def __init__(self, integration_manager: IntegrationManager) -> None:
        self._integrations = integration_manager

    async def send_sms(
        self, to: str, text: str, *, template: str | None = None,
        notification_id: str | None = None, reference: str | None = None,
    ) -> dict[str, Any]:
        return await self._integrations.execute(
            MessagingGatewayIntegrationIds.SMS_TRANSACTIONAL,
            "send_sms",
            {
                "to": to, "text": text, "template": template,
                "notification_id": notification_id, "reference": reference,
            },
        )

    async def send_email(self, to: str, subject: str, body: str, *, template: str | None = None) -> dict[str, Any]:
        return await self._integrations.execute(
            MessagingGatewayIntegrationIds.EMAIL_TRANSACTIONAL,
            "send",
            {"to": to, "subject": subject, "body": body, "template": template},
        )