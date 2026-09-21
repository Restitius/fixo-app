"""Value-domain adapters — the ONLY places CUS.WALLET.* / CUS.PROMOTION.* /
CUS.LOYALTY.* IDs appear."""
from __future__ import annotations

from typing import Any

from app.platform.query.sql_query_manager import SQLQueryManager
from app.ports.persistence.value_ports import (
    LoyaltyRepositoryPort,
    PromotionRepositoryPort,
    WalletRepositoryPort,
)


class WalletSqlAdapter(WalletRepositoryPort):
    def __init__(self, queries: SQLQueryManager) -> None:
        self._q = queries

    async def ensure(self, customer_id: str) -> dict[str, Any] | None:
        rows = await self._q.execute("CUS.WALLET.ENSURE", {"user_id": customer_id})
        return rows[0] if rows else None

    async def get_balance(self, customer_id: str) -> dict[str, Any] | None:
        rows = await self._q.execute("CUS.WALLET.GET_BALANCE", {"user_id": customer_id})
        return rows[0] if rows else None

    async def list_transactions(self, customer_id: str, limit: int, offset: int) -> list[dict[str, Any]]:
        return await self._q.execute("CUS.WALLET.LIST_TRANSACTIONS", {
            "user_id": customer_id, "limit": min(max(limit, 1), 100), "offset": max(offset, 0),
        })

    async def credit(self, customer_id: str, amount: float) -> dict[str, Any] | None:
        rows = await self._q.execute("CUS.WALLET.CREDIT", {"user_id": customer_id, "amount": amount})
        return rows[0] if rows else None

    async def debit(self, customer_id: str, amount: float) -> dict[str, Any] | None:
        rows = await self._q.execute("CUS.WALLET.DEBIT", {"user_id": customer_id, "amount": amount})
        return rows[0] if rows else None


class PromotionSqlAdapter(PromotionRepositoryPort):
    def __init__(self, queries: SQLQueryManager) -> None:
        self._q = queries

    async def list_active(self, limit: int, offset: int) -> list[dict[str, Any]]:
        return await self._q.execute("CUS.PROMOTION.LIST_ACTIVE", {
            "limit": min(max(limit, 1), 100), "offset": max(offset, 0),
        })

    async def validate(self, code: str, amount: float) -> dict[str, Any] | None:
        rows = await self._q.execute("CUS.PROMOTION.VALIDATE", {"code": code, "amount": amount})
        return rows[0] if rows else None

    async def use(self, promo_id: str) -> dict[str, Any] | None:
        rows = await self._q.execute("CUS.PROMOTION.USE", {"promo_id": promo_id})
        return rows[0] if rows else None


class LoyaltySqlAdapter(LoyaltyRepositoryPort):
    def __init__(self, queries: SQLQueryManager) -> None:
        self._q = queries

    async def ensure(self, customer_id: str) -> dict[str, Any] | None:
        rows = await self._q.execute("CUS.LOYALTY.ENSURE", {"user_id": customer_id})
        return rows[0] if rows else None

    async def get_account(self, customer_id: str) -> dict[str, Any] | None:
        rows = await self._q.execute("CUS.LOYALTY.GET_ACCOUNT", {"user_id": customer_id})
        return rows[0] if rows else None

    async def list_transactions(self, customer_id: str, limit: int, offset: int) -> list[dict[str, Any]]:
        return await self._q.execute("CUS.LOYALTY.LIST_TRANSACTIONS", {
            "user_id": customer_id, "limit": min(max(limit, 1), 100), "offset": max(offset, 0),
        })

    async def earn(self, customer_id: str, points: float, activity: str, reference_id: str | None) -> dict[str, Any] | None:
        rows = await self._q.execute("CUS.LOYALTY.EARN", {
            "user_id": customer_id, "points": points, "activity": activity,
            "reference_id": reference_id,
        })
        return rows[0] if rows else None

    async def spend(self, customer_id: str, points: float, activity: str, reference_id: str | None) -> dict[str, Any] | None:
        # A spend is a negative earn: subtract balance, ledger the negative points.
        rows = await self._q.execute("CUS.LOYALTY.EARN", {
            "user_id": customer_id, "points": -points, "activity": activity,
            "reference_id": reference_id,
        })
        return rows[0] if rows else None