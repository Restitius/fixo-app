"""AssetSqlAdapter - infrastructure adapter for the AssetRepository port.

This is the ONLY place the asset aggregate's governed query IDs appear.
Application/domain code depends on app.ports.persistence.asset_repository
and never sees these IDs or the SQLQueryManager.
"""
from __future__ import annotations

from typing import Any

from app.platform.query.sql_query_manager import SQLQueryManager


class AssetQueryIds:
    """Stable governed-query IDs for the asset aggregate (match registry.yaml)."""

    CREATE = "ASSET.CREATE"
    GET_BY_ID = "ASSET.GET_BY_ID"
    LIST = "ASSET.LIST"
    UPDATE = "ASSET.UPDATE"
    REVALUE = "ASSET.REVALUE"
    ARCHIVE = "ASSET.ARCHIVE"
    SUMMARY = "ASSET.SUMMARY"


class AssetSqlAdapter:
    """Implements the AssetRepository port using governed queries only."""

    def __init__(self, sql_manager: SQLQueryManager) -> None:
        self._sql = sql_manager

    async def get(self, user_id: str, asset_id: str) -> Any | None:
        return await self._sql.execute(
            AssetQueryIds.GET_BY_ID,
            {"asset_id": asset_id, "customer_id": user_id},
            fetch="one",
        )

    async def add(self, params: dict[str, Any]) -> Any:
        # Legacy callers may omit Phase 11 fields - every bind must exist.
        data = {
            "property_id": None, "brand": None, "serial_number": None,
            "warranty_until": None, "currency": "TZS",
            **params,
        }
        return await self._sql.execute(AssetQueryIds.CREATE, data, fetch="one")

    async def update(self, user_id: str, params: dict[str, Any]) -> Any:
        return await self._sql.execute(
            AssetQueryIds.UPDATE,
            {"customer_id": user_id, **params}, fetch="one",
        )

    async def archive(self, user_id: str, asset_id: str) -> Any:
        return await self._sql.execute(
            AssetQueryIds.ARCHIVE,
            {"customer_id": user_id, "asset_id": asset_id}, fetch="one",
        )

    async def sell(self, user_id: str, asset_id: str, sale_payload: dict[str, Any]) -> Any:
        """ASSET.SELL - register the operation when the sale flow lands."""
        raise NotImplementedError("AssetSqlAdapter.sell - ASSET.SELL not registered yet")

    async def revalue(self, user_id: str, asset_id: str, new_value: Any,
                      reason: str | None = None) -> Any:
        return await self._sql.execute(
            AssetQueryIds.REVALUE,
            {"customer_id": user_id, "asset_id": asset_id, "new_value": new_value},
            fetch="one",
        )

    async def list(self, filters: dict[str, Any]) -> Any:
        customer_id = filters.pop("user_id", None) or filters.pop("customer_id", None)
        params = {
            "customer_id": customer_id,
            "asset_type": filters.get("asset_type"),
            "search": filters.get("search"),
            "limit": filters.get("limit", 20),
            "offset": filters.get("offset", 0),
        }
        return await self._sql.execute(AssetQueryIds.LIST, params, fetch="all")

    async def summary(self, user_id: str) -> Any:
        return await self._sql.execute(
            AssetQueryIds.SUMMARY, {"customer_id": user_id}, fetch="all")