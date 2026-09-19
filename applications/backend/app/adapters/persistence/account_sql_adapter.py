"""Account adapters - the ONLY places CUS.PAYMENT_METHOD.* / CUS.PREFERENCE.* /
CUS.SECURITY.* / CUS.PRIVACY.* / CUS.ACCOUNT.* IDs appear."""
from __future__ import annotations

import json
from typing import Any

from app.platform.query.sql_query_manager import SQLQueryManager
from app.ports.persistence.account_ports import (
    AccountClosureRepositoryPort,
    PaymentMethodRepositoryPort,
    PreferenceRepositoryPort,
    PrivacyRepositoryPort,
    SecurityRepositoryPort,
)


class PaymentMethodSqlAdapter(PaymentMethodRepositoryPort):
    def __init__(self, queries: SQLQueryManager) -> None:
        self._queries = queries

    async def list(self, customer_id: str, limit: int = 20, offset: int = 0) -> list[dict[str, Any]]:
        return await self._queries.execute(
            "CUS.PAYMENT_METHOD.LIST",
                        {"user_id": customer_id, "limit": min(max(limit, 1), 100), "offset": max(offset, 0)},
        )

    async def add(self, customer_id: str, type: str, provider: str, details_masked: dict[str, Any]) -> dict[str, Any] | None:
        rows = await self._queries.execute(
            "CUS.PAYMENT_METHOD.ADD",
            {
                "user_id": customer_id,
                "type": type,
                "provider": provider,
                "details_masked": json.dumps(details_masked),
            },
        )
        return rows[0] if rows else None

    async def set_default(self, customer_id: str, method_id: str) -> dict[str, Any] | None:
        rows = await self._queries.execute(
            "CUS.PAYMENT_METHOD.SET_DEFAULT",
            {"user_id": customer_id, "method_id": method_id},
        )
        return rows[0] if rows else None

    async def remove(self, customer_id: str, method_id: str) -> bool:
        rows = await self._queries.execute(
            "CUS.PAYMENT_METHOD.REMOVE",
            {"user_id": customer_id, "method_id": method_id},
        )
        return len(rows) > 0


class PreferenceSqlAdapter(PreferenceRepositoryPort):
    def __init__(self, queries: SQLQueryManager) -> None:
        self._queries = queries

    async def list(self, customer_id: str) -> list[dict[str, Any]]:
        return await self._queries.execute(
            "CUS.PREFERENCE.LIST", {"user_id": customer_id}
        )

    async def set(self, customer_id: str, key: str, value: str) -> dict[str, Any] | None:
        rows = await self._queries.execute(
            "CUS.PREFERENCE.SET", {"user_id": customer_id, "key": key, "value": value}
        )
        return rows[0] if rows else None


class SecuritySqlAdapter(SecurityRepositoryPort):
    def __init__(self, queries: SQLQueryManager) -> None:
        self._queries = queries

    async def revoke_sessions(self, customer_id: str, reason: str) -> dict[str, Any] | None:
        rows = await self._queries.execute(
            "CUS.SECURITY.SESSIONS.REVOKE_ALL",
            {"user_id": customer_id, "reason": reason},
        )
        return rows[0] if rows else None

    async def change_password(self, customer_id: str, new_hash: str) -> bool:
        rows = await self._queries.execute(
            "CUS.SECURITY.PASSWORD.CHANGE",
            {"user_id": customer_id, "new_hash": new_hash},
        )
        return len(rows) > 0


class PrivacySqlAdapter(PrivacyRepositoryPort):
    def __init__(self, queries: SQLQueryManager) -> None:
        self._queries = queries

    async def set_consent(self, customer_id: str, kind: str, consented: bool) -> dict[str, Any] | None:
        rows = await self._queries.execute(
            "CUS.PRIVACY.CONSENT.SET",
            {"user_id": customer_id, "kind": kind, "consented": consented},
        )
        return rows[0] if rows else None

    async def list_consents(self, customer_id: str) -> list[dict[str, Any]]:
        return await self._queries.execute(
            "CUS.PRIVACY.CONSENT.LIST", {"user_id": customer_id}
        )

    async def request_export(self, customer_id: str) -> dict[str, Any] | None:
        rows = await self._queries.execute(
            "CUS.PRIVACY.EXPORT.REQUEST", {"user_id": customer_id}
        )
        return rows[0] if rows else None

    async def list_exports(self, customer_id: str, limit: int = 20, offset: int = 0) -> list[dict[str, Any]]:
        return await self._queries.execute(
            "CUS.PRIVACY.EXPORT.LIST",
            {"user_id": customer_id, "limit": min(max(limit, 1), 100), "offset": max(offset, 0)},
        )


class AccountClosureSqlAdapter(AccountClosureRepositoryPort):
    def __init__(self, queries: SQLQueryManager) -> None:
        self._queries = queries

    async def schedule_closure(self, customer_id: str) -> dict[str, Any] | None:
        rows = await self._queries.execute(
            "CUS.ACCOUNT.CLOSURE.SCHEDULE", {"user_id": customer_id}
        )
        return rows[0] if rows else None