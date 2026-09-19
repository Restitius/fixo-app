"""ProviderPortfolioRepository — provider portfolio (Requirement Phase 36).

A provider's portfolio showcases completed jobs with title, description,
service category, before/after images, and completion date.

The repository exposes CRUD operations:
- list: paginated listing with optional status filter
- get: fetch single item by id (ownership-scoped)
- add: create a new portfolio item
- update: modify an existing item (ownership-scoped)
- delete: remove an item (ownership-scoped)
"""

from __future__ import annotations

from abc import abstractmethod
from typing import Any, Protocol


class ProviderPortfolioRepository(Protocol):
    @abstractmethod
    async def list(
        self,
        provider_id: str,
        *,
        status: str | None = None,
        limit: int = 50,
        offset: int = 0,
    ) -> list[Any]: ...

    @abstractmethod
    async def get(self, provider_id: str, *, portfolio_id: str) -> Any | None: ...

    @abstractmethod
    async def add(self, provider_id: str, **fields: Any) -> Any: ...

    @abstractmethod
    async def update(self, provider_id: str, *, portfolio_id: str, **fields: Any) -> Any | None: ...

    @abstractmethod
    async def delete(self, provider_id: str, *, portfolio_id: str) -> Any | None: ...