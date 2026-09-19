"""AuthorizationService — action-level permission decisions."""
from __future__ import annotations

from typing import Any

from app.security.authentication import Principal
from app.shared.exceptions.hierarchy import AuthorizationError


class AuthorizationService:
    """Decides whether a principal may perform an action on a resource."""

    def authorize(self, principal: Principal, action: str, resource: Any | None = None) -> bool:
        """True when granted permissions cover the action (wildcards honored)."""
        raise NotImplementedError("AuthorizationService.authorize")

    def require(self, principal: Principal, action: str, resource: Any | None = None) -> None:
        """Authorize or raise AuthorizationError (HTTP 403)."""
        if not self.authorize(principal, action, resource):
            raise AuthorizationError(
                f"Not permitted: {action}",
                details={"action": action},
            )
