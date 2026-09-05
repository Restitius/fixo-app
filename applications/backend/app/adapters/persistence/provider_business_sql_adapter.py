"""ProviderBusinessSqlAdapter — implements ProviderBusinessRepository via governed queries.

This is the ONLY place PRV.BUSINESS.* query IDs appear.
"""
from __future__ import annotations

import json
from typing import Any

from app.platform.query.sql_query_manager import SQLQueryManager


class ProviderBusinessQueryIds:
    GET = "PRV.BUSINESS.GET"
    UPSERT = "PRV.BUSINESS.UPSERT"
    DELETE = "PRV.BUSINESS.DELETE"


class ProviderBusinessSqlAdapter:
    """Implements ProviderBusinessRepository.

    upsert() always binds the FULL parameter set (absent fields as NULL) so
    the governed SQL's COALESCE(EXCLUDED.x, stored) keeps values the caller
    did not supply — SQLAlchemy text() requires every named param.
    """

    _FIELDS = (
        "business_name",
        "logo_url",
        "registration_number",
        "tax_number",
        "business_email",
        "business_phone",
        "address",
        "city",
        "region",
        "country",
        "description",
        "year_established",
        "num_employees",
        "website",
    )

    def __init__(self, sql_manager: SQLQueryManager) -> None:
        self._sql = sql_manager

    async def get(self, provider_id: str) -> Any | None:
        return await self._sql.execute(
            ProviderBusinessQueryIds.GET, {"user_id": provider_id}, fetch="one"
        )

    async def upsert(self, provider_id: str, fields: dict[str, Any]) -> Any | None:
        params: dict[str, Any] = {name: None for name in self._FIELDS}
        params["user_id"] = provider_id
        # NULL => keep stored social on conflict ('{}' only when explicitly sent);
        # the CREATE path defaults to '{}' via COALESCE in the SQL.
        social = fields.get("social")
        params["social"] = json.dumps(social) if isinstance(social, dict) else None
        for name, value in fields.items():
            if name == "social":
                continue  # already bound above (json.dumps) — never overwrite
            if name in params and value is not None:
                params[name] = value
        return await self._sql.execute(
            ProviderBusinessQueryIds.UPSERT, params, fetch="one"
        )

    async def delete(self, provider_id: str) -> Any | None:
        return await self._sql.execute(
            ProviderBusinessQueryIds.DELETE, {"user_id": provider_id}, fetch="one"
        )