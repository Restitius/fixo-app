"""OtpSqlAdapter — OTP issue/verify through registered DB-function queries."""
from __future__ import annotations

from typing import Any

from app.platform.query.sql_query_manager import SQLQueryManager


class OtpQueryIds:
    ISSUE = "CUS.AUTH.OTP.ISSUE"
    VERIFY = "CUS.AUTH.OTP.VERIFY"
    RECENT_COUNT = "CUS.AUTH.OTP.RECENT_COUNT"


class OtpSqlAdapter:
    def __init__(self, sql_manager: SQLQueryManager) -> None:
        self._sql = sql_manager

    async def issue(self, user_id: str, params: dict[str, Any]) -> Any | None:
        return await self._sql.execute(
            OtpQueryIds.ISSUE, {"user_id": user_id, **params}, fetch="one"
        )

    async def verify(self, user_id: str, params: dict[str, Any]) -> bool:
        row = await self._sql.execute(
            OtpQueryIds.VERIFY, {"user_id": user_id, **params}, fetch="one"
        )
        return bool(row and row.get("ok"))

    async def recent_activity(self, user_id: str, purpose: str, window_seconds: int) -> dict[str, Any]:
        row = await self._sql.execute(
            OtpQueryIds.RECENT_COUNT,
            {"user_id": user_id, "purpose": purpose, "window_seconds": window_seconds},
            fetch="one",
        )
        return {
            "issued": int((row or {}).get("issued", 0)),
            "seconds_since_last": float((row or {}).get("seconds_since_last", 1e9)),
        }
