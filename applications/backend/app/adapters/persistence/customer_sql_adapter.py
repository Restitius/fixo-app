"""CustomerSqlAdapter — implements CustomerRepository via governed queries.

This is the ONLY place CUS.AUTH.CUSTOMER.* / CUS.PROFILE.* IDs appear.
"""
from __future__ import annotations

from typing import Any

from app.platform.query.sql_query_manager import SQLQueryManager


class CustomerQueryIds:
    CREATE = "CUS.AUTH.CUSTOMER.CREATE"
    BY_EMAIL = "CUS.AUTH.CUSTOMER.BY_EMAIL"
    BY_ID = "CUS.AUTH.CUSTOMER.BY_ID"
    BY_ID_WITH_HASH = "CUS.AUTH.CUSTOMER.BY_ID_WITH_HASH"
    MARK_VERIFIED = "CUS.AUTH.CUSTOMER.MARK_VERIFIED"
    UPDATE_PROFILE = "CUS.PROFILE.UPDATE"
    UPDATE_PASSWORD = "CUS.AUTH.CUSTOMER.UPDATE_PASSWORD"


class CustomerSqlAdapter:
    def __init__(self, sql_manager: SQLQueryManager) -> None:
        self._sql = sql_manager

    async def create(self, params: dict[str, Any]) -> Any | None:
        return await self._sql.execute(CustomerQueryIds.CREATE, params, fetch="one")

    async def get_by_email(self, email: str) -> Any | None:
        return await self._sql.execute(CustomerQueryIds.BY_EMAIL, {"email": email}, fetch="one")

    async def get_by_id(self, user_id: str) -> Any | None:
        return await self._sql.execute(CustomerQueryIds.BY_ID, {"user_id": user_id}, fetch="one")

    async def get_by_id_with_hash(self, user_id: str) -> Any | None:
        return await self._sql.execute(CustomerQueryIds.BY_ID_WITH_HASH, {"user_id": user_id}, fetch="one")

    async def mark_verified(self, user_id: str, *, email: bool, phone: bool) -> Any | None:
        return await self._sql.execute(
            CustomerQueryIds.MARK_VERIFIED,
            {"user_id": user_id, "email_verified": email, "phone_verified": phone},
            fetch="one",
        )

    async def update_profile(self, user_id: str, params: dict[str, Any]) -> Any | None:
        return await self._sql.execute(
            CustomerQueryIds.UPDATE_PROFILE, {"user_id": user_id, **params}, fetch="one"
        )

    async def update_password(self, user_id: str, password_hash: str) -> Any | None:
        return await self._sql.execute(
            CustomerQueryIds.UPDATE_PASSWORD,
            {"user_id": user_id, "password_hash": password_hash},
            fetch="one",
        )