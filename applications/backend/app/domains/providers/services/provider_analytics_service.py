"""ProviderAnalyticsService - business rules for the provider analytics overview."""
from __future__ import annotations

from typing import Any

from app.ports.persistence.provider_analytics_repository import ProviderAnalyticsRepositoryPort
from app.shared.exceptions.hierarchy import ValidationError


class ProviderAnalyticsService:
    def __init__(self, repository: ProviderAnalyticsRepositoryPort) -> None:
        self._repo = repository

    async def overview(self, provider_id: str, *, months: int = 6) -> list[dict[str, Any]]:
        if not 1 <= months <= 24:
            raise ValidationError("months must be between 1 and 24")
        return await self._repo.overview(provider_id, months=months)
