"""PermissionGateway — authorization capability for domains."""
from __future__ import annotations

from typing import Any, Protocol, runtime_checkable


@runtime_checkable
class PermissionGateway(Protocol):
    """Evaluate whether an actor holds a permission over a resource."""

    async def can(self, actor_id: str, permission: str, resource: dict[str, Any] | None = None) -> bool: ...