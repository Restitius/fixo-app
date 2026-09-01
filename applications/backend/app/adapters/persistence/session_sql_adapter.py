"""SessionSqlAdapter — refresh-token sessions via governed queries."""
from __future__ import annotations

from typing import Any

from app.platform.query.sql_query_manager import SQLQueryManager


class SessionQueryIds:
    CREATE = "CUS.AUTH.SESSION.CREATE"
    GET_VALID = "CUS.AUTH.SESSION.GET_VALID"
    REVOKE = "CUS.AUTH.SESSION.REVOKE"
    REVOKE_ALL = "CUS.AUTH.SESSION.REVOKE_ALL"


class SessionSqlAdapter:
    def __init__(self, sql_manager: SQLQueryManager) -> None:
        self._sql = sql_manager

    async def create(self, params: dict[str, Any]) -> Any | None:
        return await self._sql.execute(SessionQueryIds.CREATE, params, fetch="one")

    async def get_valid(self, refresh_token_hash: str) -> Any | None:
        row = await self._sql.execute(
            SessionQueryIds.GET_VALID, {"refresh_token_hash": refresh_token_hash}, fetch="one"
        )
        # cache key includes the token hash; drop it from the returned payload
        if isinstance(row, dict):
            row.pop("refresh_token_hash", None)
        return row

    async def revoke(self, refresh_token_hash: str) -> Any | None:
        return await self._sql.execute(
            SessionQueryIds.REVOKE, {"refresh_token_hash": refresh_token_hash}, fetch="one"
        )

    async def revoke_all(self, user_id: str) -> Any | None:
        return await self._sql.execute(
            SessionQueryIds.REVOKE_ALL, {"user_id": str(user_id)}, fetch="one"
        )