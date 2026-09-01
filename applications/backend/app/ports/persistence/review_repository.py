"""Review repository port — business-facing contract for reviews."""
from __future__ import annotations
from abc import ABC, abstractmethod
from typing import Any

class ReviewRepositoryPort(ABC):
    @abstractmethod
    async def create(self, booking_id: str, customer_id: str, service_id: str,
                     provider_id: str, rating: int, comment: str | None) -> dict[str, Any]: ...

    @abstractmethod
    async def list(self, entity_type: str, entity_id: str, customer_id: str,
                   page: int, limit: int) -> list[dict[str, Any]]: ...

    @abstractmethod
    async def stats(self, entity_type: str, entity_id: str) -> dict[str, Any]: ...
