"""Ownership enforcement helpers (architecture section 26).

Defense in depth:
    API authorization  +  domain policy  +  SQL ownership filter.
These helpers feed the SQL layer (:user_id params) and assert in Python.
"""
from __future__ import annotations

from typing import Any

from app.shared.exceptions.hierarchy import AuthorizationError

OWNERSHIP_PARAM = "user_id"


def ownership_params(user_id: str) -> dict[str, Any]:
    """Bind parameters that MUST accompany ownership-filtered queries."""
    return {OWNERSHIP_PARAM: user_id}


def scoped_params(user_id: str, extra: dict[str, Any] | None = None) -> dict[str, Any]:
    """Merge caller params with mandatory ownership scope."""
    merged: dict[str, Any] = dict(extra or {})
    merged.update(ownership_params(user_id))
    return merged


def assert_owner(principal_user_id: str, resource_owner_id: str) -> None:
    """Raise AuthorizationError when the resource belongs to someone else."""
    if str(principal_user_id) != str(resource_owner_id):
        raise AuthorizationError(
            "Resource does not belong to the authenticated user",
            code="AUTHZ.NOT_OWNER",
        )
