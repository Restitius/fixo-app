"""Provider settings persistence ports - preferences + privacy.

Mirrors app/ports/persistence/account_ports.py for providers. Security
(password change, session revocation) reuses ProviderAccountRepository
directly rather than a parallel port.
"""
from __future__ import annotations

from typing import Any, Protocol


class ProviderPreferenceRepositoryPort(Protocol):
    async def list(self, provider_id: str) -> list[dict[str, Any]]: ...
    async def set(self, provider_id: str, key: str, value: str) -> dict[str, Any] | None: ...


class ProviderPrivacyRepositoryPort(Protocol):
    async def set_consent(self, provider_id: str, kind: str, consented: bool) -> dict[str, Any] | None: ...
    async def list_consents(self, provider_id: str) -> list[dict[str, Any]]: ...
    async def request_export(self, provider_id: str) -> dict[str, Any] | None: ...
    async def list_exports(
        self, provider_id: str, limit: int = 20, offset: int = 0
    ) -> list[dict[str, Any]]: ...
