
from __future__ import annotations
from abc import abstractmethod
from typing import Any, Protocol


class ProviderKpisRepository(Protocol):
    @abstractmethod
    async def list(
        self,
        provider_id: str,
        *,
        period: str | None = None,
        limit: int = 50,
        offset: int = 0,
    ) -> list[Any]: ...

    @abstractmethod
    async def summary(self, provider_id: str) -> Any: ...