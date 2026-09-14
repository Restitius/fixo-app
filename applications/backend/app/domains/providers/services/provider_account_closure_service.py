"""ProviderAccountClosureService - mirrors AccountClosureService (Phase 54)."""
from __future__ import annotations

from typing import Any

from app.ports.persistence.provider_account_closure_repository import (
    ProviderAccountClosureRepositoryPort,
)


class ProviderAccountClosureService:
    def __init__(self, repo: ProviderAccountClosureRepositoryPort) -> None:
        self._repo = repo

    async def schedule_closure(self, provider_id: str) -> dict[str, Any]:
        result = await self._repo.schedule_closure(provider_id)
        if result is None:
            raise RuntimeError("Failed to schedule account closure")
        return result
