"""Provider settings adapters - preferences + privacy (Phase 50).

Mirrors app/adapters/persistence/account_sql_adapter.py's
PreferenceSqlAdapter/PrivacySqlAdapter for providers.
"""
from __future__ import annotations

from typing import Any

from app.platform.query.sql_query_manager import SQLQueryManager
from app.ports.persistence.provider_settings_repository import (
    ProviderPreferenceRepositoryPort,
    ProviderPrivacyRepositoryPort,
)


class ProviderPreferenceSqlAdapter(ProviderPreferenceRepositoryPort):
    def __init__(self, queries: SQLQueryManager) -> None:
        self._queries = queries

    async def list(self, provider_id: str) -> list[dict[str, Any]]:
        return await self._queries.execute(
            "PROV.SETTINGS.PREFERENCE.LIST", {"user_id": provider_id}
        )

    async def set(self, provider_id: str, key: str, value: str) -> dict[str, Any] | None:
        rows = await self._queries.execute(
            "PROV.SETTINGS.PREFERENCE.SET", {"provider_id": provider_id, "key": key, "value": value}
        )
        return rows[0] if rows else None


class ProviderPrivacySqlAdapter(ProviderPrivacyRepositoryPort):
    def __init__(self, queries: SQLQueryManager) -> None:
        self._queries = queries

    async def set_consent(self, provider_id: str, kind: str, consented: bool) -> dict[str, Any] | None:
        rows = await self._queries.execute(
            "PROV.SETTINGS.PRIVACY.CONSENT.SET",
            {"provider_id": provider_id, "kind": kind, "consented": consented},
        )
        return rows[0] if rows else None

    async def list_consents(self, provider_id: str) -> list[dict[str, Any]]:
        return await self._queries.execute(
            "PROV.SETTINGS.PRIVACY.CONSENT.LIST", {"user_id": provider_id}
        )

    async def request_export(self, provider_id: str) -> dict[str, Any] | None:
        rows = await self._queries.execute(
            "PROV.SETTINGS.PRIVACY.EXPORT.REQUEST", {"provider_id": provider_id}
        )
        return rows[0] if rows else None

    async def list_exports(
        self, provider_id: str, limit: int = 20, offset: int = 0
    ) -> list[dict[str, Any]]:
        return await self._queries.execute(
            "PROV.SETTINGS.PRIVACY.EXPORT.LIST",
            {"user_id": provider_id, "limit": limit, "offset": offset},
        )
