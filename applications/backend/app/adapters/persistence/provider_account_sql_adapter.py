"""ProviderAccountSqlAdapter — implements ProviderAccountRepository via governed queries.

This is the ONLY place PROV.AUTH.* query IDs appear.
"""
from __future__ import annotations

from typing import Any

from app.platform.query.sql_query_manager import SQLQueryManager


class ProviderAuthQueryIds:
    REGISTER = "PROV.AUTH.PROVIDER.REGISTER"
    BY_EMAIL = "PROV.AUTH.PROVIDER.BY_EMAIL"
    BY_ID = "PROV.AUTH.PROVIDER.BY_ID"
    BY_ID_WITH_HASH = "PROV.AUTH.PROVIDER.BY_ID_WITH_HASH"
    MARK_VERIFIED = "PROV.AUTH.PROVIDER.MARK_VERIFIED"
    UPDATE_PASSWORD = "PROV.AUTH.PROVIDER.UPDATE_PASSWORD"
    OTP_ISSUE = "PROV.AUTH.OTP.ISSUE"
    OTP_VERIFY = "PROV.AUTH.OTP.VERIFY"
    SESSION_CREATE = "PROV.AUTH.SESSION.CREATE"
    SESSION_GET_VALID = "PROV.AUTH.SESSION.GET_VALID"
    SESSION_REVOKE = "PROV.AUTH.SESSION.REVOKE"
    SESSION_REVOKE_ALL = "PROV.AUTH.SESSION.REVOKE_ALL"


class ProviderAccountSqlAdapter:
    def __init__(self, sql_manager: SQLQueryManager) -> None:
        self._sql = sql_manager

    async def create(self, params: dict[str, Any]) -> Any | None:
        return await self._sql.execute(ProviderAuthQueryIds.REGISTER, params, fetch="one")

    async def get_by_email(self, email: str) -> Any | None:
        return await self._sql.execute(
            ProviderAuthQueryIds.BY_EMAIL, {"email": email}, fetch="one"
        )

    async def get_by_id(self, user_id: str) -> Any | None:
        return await self._sql.execute(
            ProviderAuthQueryIds.BY_ID, {"user_id": user_id}, fetch="one"
        )

    async def get_by_id_with_hash(self, user_id: str) -> Any | None:
        return await self._sql.execute(
            ProviderAuthQueryIds.BY_ID_WITH_HASH, {"user_id": user_id}, fetch="one"
        )

    async def mark_verified(self, user_id: str, *, email: bool, phone: bool) -> Any | None:
        return await self._sql.execute(
            ProviderAuthQueryIds.MARK_VERIFIED,
            {"user_id": user_id, "email_verified": email, "phone_verified": phone},
            fetch="one",
        )

    async def update_password(self, user_id: str, password_hash: str) -> Any | None:
        return await self._sql.execute(
            ProviderAuthQueryIds.UPDATE_PASSWORD,
            {"user_id": user_id, "password_hash": password_hash},
            fetch="one",
        )

    async def issue_otp(
        self, user_id: str, channel: str, purpose: str, code_hash: str, ttl_minutes: int
    ) -> Any | None:
        return await self._sql.execute(
            ProviderAuthQueryIds.OTP_ISSUE,
            {"user_id": user_id, "channel": channel, "purpose": purpose,
             "code_hash": code_hash, "ttl_minutes": ttl_minutes},
            fetch="one",
        )

    async def verify_otp(self, user_id: str, purpose: str, code_hash: str) -> bool:
        row = await self._sql.execute(
            ProviderAuthQueryIds.OTP_VERIFY,
            {"user_id": user_id, "purpose": purpose, "code_hash": code_hash},
            fetch="one",
        )
        return bool(row and row.get("ok"))

    async def session_create(
        self, user_id: str, refresh_token_hash: str, device_info: str, ip_address: str, ttl_seconds: int
    ) -> Any | None:
        return await self._sql.execute(
            ProviderAuthQueryIds.SESSION_CREATE,
            {"user_id": user_id, "refresh_token_hash": refresh_token_hash,
             "device_info": device_info, "ip_address": ip_address,
             "ttl_seconds": ttl_seconds},
            fetch="one",
        )

    async def session_get_valid(self, refresh_token_hash: str) -> Any | None:
        return await self._sql.execute(
            ProviderAuthQueryIds.SESSION_GET_VALID,
            {"refresh_token_hash": refresh_token_hash},
            fetch="one",
        )

    async def session_revoke(self, refresh_token_hash: str) -> Any | None:
        return await self._sql.execute(
            ProviderAuthQueryIds.SESSION_REVOKE,
            {"refresh_token_hash": refresh_token_hash},
            fetch="one",
        )

    async def session_revoke_all(self, user_id: str) -> Any | None:
        return await self._sql.execute(
            ProviderAuthQueryIds.SESSION_REVOKE_ALL,
            {"user_id": user_id},
            fetch="one",
        )