"""Provider account-restrictions persistence port - business-facing contract only."""
from __future__ import annotations

from datetime import datetime
from typing import Any, Protocol


class ProviderAccountRestrictionsRepositoryPort(Protocol):
    async def impose(
        self,
        provider_id: str,
        *,
        restriction_type: str,
        reason: str,
        expires_at: datetime | None,
    ) -> dict[str, Any] | None:
        ...

    async def lift(
        self, restriction_id: str, *, lifted_reason: str | None
    ) -> dict[str, Any] | None:
        ...

    async def list_active(self, provider_id: str) -> list[dict[str, Any]]:
        ...

    async def history(
        self, provider_id: str, *, limit: int = 20, offset: int = 0
    ) -> list[dict[str, Any]]:
        ...
