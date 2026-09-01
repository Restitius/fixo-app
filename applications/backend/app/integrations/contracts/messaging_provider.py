"""MessagingProvider contract — topic/stream publishing surface."""
from __future__ import annotations

from abc import abstractmethod
from typing import Any

from app.integrations.contracts.base_integration import BaseIntegration


class MessagingProvider(BaseIntegration):
    @abstractmethod
    async def publish(self, topic: str, payload: dict[str, Any], *, key: str | None = None) -> dict[str, Any]:
        """Publish a message to a topic/queue/exchange."""
