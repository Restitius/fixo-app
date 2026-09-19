"""Promotion service — validate codes, consume uses (Module 35)."""
from __future__ import annotations

from typing import Any

from app.ports.persistence.value_ports import PromotionRepositoryPort


class PromotionService:
    def __init__(self, repo: PromotionRepositoryPort) -> None:
        self._repo = repo

    async def list_active(self, limit: int = 20, offset: int = 0) -> list[dict[str, Any]]:
        return await self._repo.list_active(limit, offset)

    async def validate(self, code: str, amount: float) -> dict[str, Any]:
        if amount <= 0:
            raise ValueError("Order amount must be positive")
        row = await self._repo.validate(code.strip().upper(), amount)
        if not row:
            raise ValueError("Promotion code is not valid or has expired")
        return row

    async def use(self, promo_id: str) -> dict[str, Any]:
        row = await self._repo.use(promo_id)
        if not row:
            raise ValueError("Promotion is no longer available")
        return row