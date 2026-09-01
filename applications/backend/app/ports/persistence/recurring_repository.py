"""Recurring repository port - business-facing contract for subscriptions."""
from __future__ import annotations
from abc import ABC, abstractmethod
from typing import Any


class RecurringRepositoryPort(ABC):
    @abstractmethod
    async def create(self, customer_id: str, data: dict[str, Any]) -> dict[str, Any]: ...

    @abstractmethod
    async def list(self, customer_id: str, page: int, limit: int) -> list[dict[str, Any]]: ...

    @abstractmethod
    async def get(self, customer_id: str, recurring_id: str) -> dict[str, Any] | None: ...

    @abstractmethod
    async def set_status(self, customer_id: str, recurring_id: str,
                         from_state: str, to_state: str) -> dict[str, Any] | None: ...

    # -- scheduler-facing (system) --
    @abstractmethod
    async def due(self, limit: int = 100) -> list[dict[str, Any]]: ...

    @abstractmethod
    async def generate_request(self, recurring_id: str) -> dict[str, Any] | None: ...
