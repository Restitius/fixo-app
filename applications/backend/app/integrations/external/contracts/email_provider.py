"""EmailProvider contract — transactional email surface."""
from __future__ import annotations

from abc import abstractmethod
from dataclasses import dataclass, field

from app.integrations.external.contracts.base_integration import BaseIntegration


@dataclass(frozen=True)
class MessageReceipt:
    provider_message_id: str
    accepted: bool
    details: dict = field(default_factory=dict)


class EmailProvider(BaseIntegration):
    @abstractmethod
    async def send_email(
        self,
        to: str,
        subject: str,
        body: str,
        *,
        html: bool = False,
        cc: list[str] | None = None,
        attachments: list[dict] | None = None,
    ) -> MessageReceipt:
        """Send one transactional email."""
