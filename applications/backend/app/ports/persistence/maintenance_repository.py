"""Maintenance repository port - business-facing contract for upkeep plans."""
from __future__ import annotations
from abc import ABC, abstractmethod
from typing import Any


class MaintenanceRepositoryPort(ABC):
    @abstractmethod
    async def create_plan(self, customer_id: str, data: dict[str, Any]) -> dict[str, Any]: ...

    @abstractmethod
    async def list_plans(self, customer_id: str, page: int, limit: int) -> list[dict[str, Any]]: ...

    @abstractmethod
    async def get_plan(self, customer_id: str, plan_id: str) -> dict[str, Any] | None: ...

    @abstractmethod
    async def mark_done(self, customer_id: str, plan_id: str) -> dict[str, Any] | None: ...

    @abstractmethod
    async def cancel(self, customer_id: str, plan_id: str) -> dict[str, Any] | None: ...

    # -- scheduler-facing (system) --
    @abstractmethod
    async def overdue(self, limit: int = 100) -> list[dict[str, Any]]: ...

    @abstractmethod
    async def flag_overdue(self) -> list[dict[str, Any]]: ...
