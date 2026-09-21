"""TokenService — mint/verify access & refresh tokens for sessions."""
from __future__ import annotations

from typing import Any


class TokenService:
    """Wraps security.jwt.JwtService with domain semantics (rotation, family)."""

    def __init__(self, jwt_service: Any, session_repository: Any) -> None:
        self._jwt = jwt_service
        self._sessions = session_repository

    async def issue_pair(self, user_id: str, device_fingerprint: str) -> dict:
        """Mint access+refresh tokens and persist the session binding."""
        raise NotImplementedError("TokenService.issue_pair")

    async def rotate(self, refresh_token: str) -> dict:
        """Rotate refresh token (reuse detection revokes the family)."""
        raise NotImplementedError("TokenService.rotate")

    async def revoke(self, session_id: str, actor_id: str) -> None:
        """Revoke one session (logout or incident response)."""
        raise NotImplementedError("TokenService.revoke")
