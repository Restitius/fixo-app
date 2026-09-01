"""Rebook repository port — business-facing contract for rebooking."""
from __future__ import annotations
from abc import ABC, abstractmethod
from typing import Any

class RebookRepositoryPort(ABC):
    @abstractmethod
    async def preview(self, booking_id: str, customer_id: str) -> dict[str, Any] | None: ...

    @abstractmethod
    async def create_request(self, booking_id: str, customer_id: str) -> dict[str, Any]: ...
