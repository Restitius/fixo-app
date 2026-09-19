"""NotificationGateway — business notification capability (channel-agnostic)."""
from __future__ import annotations

from typing import Any, Protocol, runtime_checkable


@runtime_checkable
class NotificationGateway(Protocol):
    """Create/send a persisted user notification without knowing channels."""

    async def send(self, key: str, recipient_id: str, payload: dict[str, Any]) -> Any: ...