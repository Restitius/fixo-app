"""HomeReadAdapter — implements every Home read port via governed queries.

One governed query (CUS.HOME.DASHBOARD) powers environment + catalog slices.
Ports whose domains land later resolve to safe empty payloads here so the
dashboard response shape stays stable across phases.
"""
from __future__ import annotations

import json
from collections.abc import Callable
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


_TERMINAL_BOOKING_STATUSES = frozenset({"CLOSED", "CANCELLED"})


class ActiveBookingReader:
    """ActiveBookingReadPort — the customer's bookings that are still in flight."""

    def __init__(self, booking_service_factory: Callable[[], Any]) -> None:
        self._factory = booking_service_factory

    async def active(self, customer_id: str, limit: int = 3) -> list[dict[str, Any]]:
        rows = await self._factory().list(customer_id, limit=50)
        live = [r for r in rows if r.get("status") not in _TERMINAL_BOOKING_STATUSES]
        return live[:limit]

    async def active_count(self, customer_id: str) -> int:
        rows = await self._factory().list(customer_id, limit=200)
        return sum(1 for r in rows if r.get("status") not in _TERMINAL_BOOKING_STATUSES)


class WalletReader:
    """WalletReadPort — the customer's real wallet balance."""

    def __init__(self, wallet_service_factory: Callable[[], Any]) -> None:
        self._factory = wallet_service_factory

    async def balance(self, customer_id: str) -> dict[str, Any]:
        row = await self._factory().balance(customer_id)
        return {**row, "available": True}


class NotificationReader:
    """NotificationReadPort — the real unread badge count."""

    def __init__(self, notification_service_factory: Callable[[], Any]) -> None:
        self._factory = notification_service_factory

    async def unread_count(self, customer_id: str) -> int:
        return int(await self._factory().unread_count(customer_id))


class RecommendationStubReader:
    """RecommendationReadPort — personalisation arrives with Phase 3 search."""

    async def for_customer(self, customer_id: str, limit: int = 3) -> list[dict[str, Any]]:
        return []
