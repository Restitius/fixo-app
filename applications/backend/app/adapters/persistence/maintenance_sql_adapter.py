"""Maintenance SQL adapter - the ONLY place CUS.MAINTENANCE.* IDs appear."""
from __future__ import annotations
from typing import Any

from app.platform.query.sql_query_manager import SQLQueryManager
from app.ports.persistence.maintenance_repository import MaintenanceRepositoryPort


class MaintenanceSqlAdapter(MaintenanceRepositoryPort):
    def __init__(self, sql_manager: SQLQueryManager) -> None:
        self._sql = sql_manager

    async def create_plan(self, customer_id: str, data: dict[str, Any]) -> dict[str, Any]:
        row = await self._sql.execute(
            "CUS.MAINTENANCE.CREATE",
            {"customer_id": customer_id, **data}, fetch="one",
        )
        return dict(row) if row else {}

    async def list_plans(self, customer_id: str, page: int, limit: int) -> list[dict[str, Any]]:
        rows = await self._sql.execute(
            "CUS.MAINTENANCE.LIST",
            {"customer_id": customer_id,
             "offset": (page - 1) * limit, "limit": limit},
            fetch="all",
        )
        return list(rows or [])

    async def get_plan(self, customer_id: str, plan_id: str) -> dict[str, Any] | None:
        row = await self._sql.execute(
            "CUS.MAINTENANCE.GET",
            {"customer_id": customer_id, "plan_id": plan_id}, fetch="one",
        )
        return dict(row) if row else None

    async def mark_done(self, customer_id: str, plan_id: str) -> dict[str, Any] | None:
        row = await self._sql.execute(
            "CUS.MAINTENANCE.DONE",
            {"customer_id": customer_id, "plan_id": plan_id}, fetch="one",
        )
        return dict(row) if row else None

    async def cancel(self, customer_id: str, plan_id: str) -> dict[str, Any] | None:
        row = await self._sql.execute(
            "CUS.MAINTENANCE.CANCEL",
            {"customer_id": customer_id, "plan_id": plan_id}, fetch="one",
        )
        return dict(row) if row else None

    async def overdue(self, limit: int = 100) -> list[dict[str, Any]]:
        rows = await self._sql.execute(
            "CUS.MAINTENANCE.OVERDUE", {"limit": limit}, fetch="all",
        )
        return list(rows or [])

    async def flag_overdue(self) -> list[dict[str, Any]]:
        rows = await self._sql.execute(
            "CUS.MAINTENANCE.FLAG_OVERDUE", {}, fetch="all",
        )
        return list(rows or [])
