"""ProviderSubscriptionsService - business rules for provider plans/subscriptions."""
from __future__ import annotations

from typing import Any

from app.ports.persistence.provider_subscriptions_repository import (
    ProviderSubscriptionsRepositoryPort,
)
from app.shared.exceptions.hierarchy import ConflictError, NotFoundError


class ProviderSubscriptionsService:
    def __init__(self, repository: ProviderSubscriptionsRepositoryPort) -> None:
        self._repo = repository

    async def list_plans(self) -> list[dict[str, Any]]:
        return await self._repo.list_plans()

    async def current(self, provider_id: str) -> dict[str, Any]:
        current = await self._repo.current(provider_id)
        if current is None:
            raise NotFoundError("No active subscription")
        return current

    async def subscribe(self, provider_id: str, *, plan_id: str) -> dict[str, Any]:
        record = await self._repo.subscribe(provider_id, plan_id=plan_id)
        if record is None:
            raise NotFoundError("Plan not found or no longer available")
        return record

    async def cancel(self, provider_id: str) -> dict[str, Any]:
        result = await self._repo.cancel(provider_id)
        if result is None:
            raise ConflictError("No active subscription to cancel")
        return result

    async def history(
        self, provider_id: str, *, limit: int = 20, offset: int = 0
    ) -> list[dict[str, Any]]:
        return await self._repo.history(provider_id, limit=limit, offset=offset)
