"""Integration contract — what every provider adapter must satisfy."""
from __future__ import annotations

from typing import Any, Protocol, runtime_checkable


@runtime_checkable
class Integration(Protocol):
    """Surface the IntegrationManager drives (§7-§8)."""

    integration_id: str

    async def execute(self, operation: str, payload: dict[str, Any]) -> dict[str, Any]:
        """Run one named operation against the external system."""
        ...

    async def health(self) -> bool:
        """Cheap liveness probe for the external system."""
        ...
