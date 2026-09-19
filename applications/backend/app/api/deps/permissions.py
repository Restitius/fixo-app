"""Permission dependency factory — enforce required permissions per route."""
from __future__ import annotations

from collections.abc import Callable

from app.api.deps.auth import PrincipalDep
from app.security.authentication import Principal
from app.security.permissions import has_permission
from app.shared.exceptions.hierarchy import AuthorizationError


def require_permissions(*required: str) -> Callable[..., Principal]:
    """Build a dependency asserting the principal holds EVERY permission."""

    async def checker(principal: PrincipalDep) -> Principal:
        for permission in required:
            if not has_permission(principal.permissions, permission):
                raise AuthorizationError(
                    f"Missing permission: {permission}",
                    details={"required": list(required)},
                )
        return principal

    return checker
