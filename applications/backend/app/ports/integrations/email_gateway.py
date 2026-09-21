"""EmailGateway — transactional email capability (provider-agnostic)."""
from __future__ import annotations

from typing import Any, Protocol, runtime_checkable


@runtime_checkable
class EmailGateway(Protocol):
    """Send one transactional email."""

    async def send(self, to: str, subject: str, body: str, *, template: str | None = None) -> dict[str, Any]: ...