"""SmsGateway — transactional SMS capability (provider-agnostic)."""
from __future__ import annotations

from typing import Any, Protocol, runtime_checkable


@runtime_checkable
class SmsGateway(Protocol):
    """Send one SMS to a recipient phone number."""

    async def send(self, to: str, text: str, *, template: str | None = None) -> dict[str, Any]: ...