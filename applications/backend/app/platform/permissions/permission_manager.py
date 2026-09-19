"""PermissionManager — authorization policy resolution (facade)."""
from __future__ import annotations

from typing import Any


class PermissionManager:
    """Evaluate a permission against roles/policies/ownership (scaffold)."""

    async def can(self, *, actor_id: str, permission: str, resource: dict[str, Any] | None = None) -> bool:
        """Ownership-aware authorization check for an actor."""
        raise NotImplementedError("PermissionManager.can — wire policy registry")