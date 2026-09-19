"""Warranty repository port — business-facing contract for warranties."""
from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Any


class WarrantyRepositoryPort(ABC):
    @abstractmethod
    async def create(self, booking_id: str, customer_id: str, provider_id: str,
                     service_id: str, starts_at: str, expires_at: str) -> dict[str, Any]: ...

    @abstractmethod
    async def list(self, customer_id: str, page: int, limit: int) -> list[dict[str, Any]]: ...

    @abstractmethod
    async def get(self, warranty_id: str, customer_id: str) -> dict[str, Any] | None: ...

    @abstractmethod
    async def claim(self, warranty_id: str, customer_id: str, description: str) -> dict[str, Any]: ...
