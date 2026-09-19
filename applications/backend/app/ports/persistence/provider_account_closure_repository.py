"""ProviderAccountClosureRepository port - mirrors AccountClosureRepositoryPort for providers."""
from __future__ import annotations

from typing import Any, Protocol


class ProviderAccountClosureRepositoryPort(Protocol):
    async def schedule_closure(self, provider_id: str) -> dict[str, Any] | None: ...
