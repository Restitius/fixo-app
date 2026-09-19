"""AuthenticationService — credential verification and Principal issuance."""
from __future__ import annotations

from dataclasses import dataclass, field


@dataclass(frozen=True)
class Principal:
    """Authenticated identity flowing through the request context."""

    user_id: str
    username: str
    roles: tuple[str, ...] = ()
    permissions: frozenset[str] = field(default_factory=frozenset)
    tenant_id: str | None = None


class AuthenticationService:
    """Verifies credentials (via SHARED.USER.BY_LOGIN + PasswordHasher)."""

    async def authenticate(self, login: str, password: str) -> Principal:
        raise NotImplementedError("AuthenticationService.authenticate")

    async def principal_from_token(self, token: str) -> Principal:
        raise NotImplementedError("AuthenticationService.principal_from_token")
