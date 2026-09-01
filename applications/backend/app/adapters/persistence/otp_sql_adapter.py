"""OtpSqlAdapter — OTP issue/verify through registered DB-function queries."""
from __future__ import annotations

from typing import Any

from app.platform.query.sql_query_manager import SQLQueryManager


class OtpQueryIds:
    ISSUE = "CUS.AUTH.OTP.ISSUE"
    VERIFY = "CUS.AUTH.OTP.VERIFY"


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