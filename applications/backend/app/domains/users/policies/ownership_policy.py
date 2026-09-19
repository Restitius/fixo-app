"""OwnershipPolicy — hard ownership assertion (layer 2 of 3)."""
from __future__ import annotations

from app.security.ownership import assert_owner


class OwnershipPolicy:
    @staticmethod
    def assert_can_access(user_id: str, resource_owner_id: str) -> None:
        assert_owner(user_id, resource_owner_id)
