"""Loyalty service — points earn/spend on a running-total ledger (Module 36)."""
from __future__ import annotations

from typing import Any

from app.ports.persistence.value_ports import LoyaltyRepositoryPort


class LoyaltyService:
    def __init__(self, repo: LoyaltyRepositoryPort) -> None:
        self._repo = repo

    async def _account(self, customer_id: str) -> dict[str, Any]:
        row = await self._repo.get_account(customer_id) or await self._repo.ensure(customer_id)
        if not row:
            raise RuntimeError("Loyalty account could not be provisioned")
        return row

    async def account(self, customer_id: str) -> dict[str, Any]:
        return await self._account(customer_id)

    async def transactions(self, customer_id: str, limit: int = 20, offset: int = 0) -> list[dict[str, Any]]:
        return await self._repo.list_transactions(customer_id, limit, offset)

    async def earn(self, customer_id: str, points: float, activity: str = "MANUAL",
                   reference_id: str | None = None) -> dict[str, Any]:
        if points <= 0:
            raise ValueError("Points to earn must be positive")
        await self._account(customer_id)
        row = await self._repo.earn(customer_id, points, activity, reference_id)
        if not row:
            raise RuntimeError("Points earn failed")
        return row

    async def spend(self, customer_id: str, points: float, activity: str = "REDEMPTION",
                    reference_id: str | None = None) -> dict[str, Any]:
        if points <= 0:
            raise ValueError("Points to spend must be positive")
        account = await self._account(customer_id)
        if float(account["points_balance"]) < points:
            raise ValueError("Insufficient loyalty points")
        row = await self._repo.spend(customer_id, points, activity, reference_id)
        if not row:
            raise ValueError("Insufficient loyalty points")
        return row