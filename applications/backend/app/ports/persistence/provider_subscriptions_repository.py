"""Provider subscriptions persistence port - business-facing contract only."""
from __future__ import annotations

from typing import Any, Protocol


class ProviderSubscriptionsRepositoryPort(Protocol):
    async def list_plans(self) -> list[dict[str, Any]]:
        ...

    async def current(self, provider_id: str) -> dict[str, Any] | None:
        ...

    async def subscribe(self, provider_id: str, *, plan_id: str) -> dict[str, Any] | None:
        ...

    async def cancel(self, provider_id: str) -> dict[str, Any] | None:
        ...

    async def history(
        self, provider_id: str, *, limit: int = 20, offset: int = 0
    ) -> list[dict[str, Any]]:
        ...
