
from __future__ import annotations
from abc import abstractmethod
from typing import Any, Protocol


class ProviderReviewsRepository(Protocol):
    @abstractmethod
    async def list(
        self,
        provider_id: str,
        *,
        status: str | None = None,
        min_rating: int | None = None,
        limit: int = 50,
        offset: int = 0,
    ) -> list[Any]: ...

    @abstractmethod
    async def detail(self, provider_id: str, *, review_id: str) -> Any | None: ...

    @abstractmethod
    async def summary(self, provider_id: str) -> Any: ...