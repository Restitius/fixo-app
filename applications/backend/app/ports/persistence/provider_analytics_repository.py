"""Provider analytics persistence port - business-facing contract only."""
from __future__ import annotations

from typing import Any, Protocol


class ProviderAnalyticsRepositoryPort(Protocol):
    async def overview(self, provider_id: str, *, months: int) -> list[dict[str, Any]]:
        ...
