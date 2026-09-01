"""OwnershipPolicy — hard assertion that a resource belongs to the caller."""
from __future__ import annotations

from app.security.ownership import assert_owner


class OwnershipPolicy:
    """Layer 2 of the three-layer ownership defense (API + policy + SQL)."""

    @staticmethod
    def assert_can_access(user_id: str, resource_owner_id: str) -> None:
        """Raises AuthorizationError when identities differ (implemented)."""
        assert_owner(user_id, resource_owner_id)
