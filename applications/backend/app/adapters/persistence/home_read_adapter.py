"""HomeReadAdapter — implements every Home read port via governed queries.

One governed query (CUS.HOME.DASHBOARD) powers environment + catalog slices.
Ports whose domains land later resolve to safe empty payloads here so the
dashboard response shape stays stable across phases.
"""
from __future__ import annotations

import json
from typing import Any

from app.platform.query.sql_query_manager import SQLQueryManager


class HomeReadQueryIds:
    DASHBOARD = "CUS.HOME.DASHBOARD"


def _as_list(value: Any) -> list[dict[str, Any]]:
    """json_agg arrives as text on some drivers — normalise once."""
    if isinstance(value, str):
        value = json.loads(value)
    return list(value or [])


class HomeEnvironmentReadAdapter:
    """EnvironmentReadPort — counts + default-address flag."""

    def __init__(self, sql_manager: SQLQueryManager) -> None:
        self._sql = sql_manager

    async def summary(self, customer_id: str) -> dict[str, Any]:
        row = await self._sql.execute(
            HomeReadQueryIds.DASHBOARD, {"customer_id": customer_id}, fetch="one"
        ) or {}
        return {
            "property_count": int(row.get("property_count") or 0),
            "address_count": int(row.get("address_count") or 0),
            "has_default_address": bool(row.get("has_default_address")),
        }


class HomeCatalogReadAdapter:
    """CatalogReadPort — categories + popular services."""

    def __init__(self, sql_manager: SQLQueryManager) -> None:
        self._sql = sql_manager

    async def _row(self, customer_id: str) -> dict[str, Any]:
        return await self._sql.execute(
            HomeReadQueryIds.DASHBOARD, {"customer_id": customer_id}, fetch="one"
        ) or {}

    async def categories(self, customer_id: str, limit: int = 8) -> list[dict[str, Any]]:
        return _as_list((await self._row(customer_id)).get("categories"))[:limit]

    async def popular_services(self, customer_id: str, limit: int = 6) -> list[dict[str, Any]]:
        return _as_list((await self._row(customer_id)).get("popular_services"))[:limit]


# -- Future-phase ports: stable empty payloads until their domains land --------


class ActiveBookingStubReader:
    """ActiveBookingReadPort — bookings arrive with Phase 6/7."""

    async def active(self, customer_id: str, limit: int = 3) -> list[dict[str, Any]]:
        return []


class WalletStubReader:
    """WalletReadPort — wallet arrives with Phase 12."""

    async def balance(self, customer_id: str) -> dict[str, Any]:
        return {"balance": 0, "currency": "USD", "available": False}


class NotificationStubReader:
    """NotificationReadPort — notification center arrives with Phase 14."""

    async def unread_count(self, customer_id: str) -> int:
        return 0


class RecommendationStubReader:
    """RecommendationReadPort — personalisation arrives with Phase 3 search."""

    async def for_customer(self, customer_id: str, limit: int = 3) -> list[dict[str, Any]]:
        return []
