"""Favorite repository port — business-facing contract for favorites."""
from __future__ import annotations
from abc import ABC, abstractmethod
from typing import Any

class FavoriteRepositoryPort(ABC):
    @abstractmethod
    async def toggle(self, customer_id: str, provider_id: str) -> dict[str, Any]: ...

    @abstractmethod
    async def list(self, customer_id: str, page: int, limit: int) -> list[dict[str, Any]]: ...
