"""SQLite driver adapter (aiosqlite) — development/tests target.

Dialect notes:
    - Named ':param' binds supported.
    - No server-side CURRENT_TIMESTAMP precision guarantees; fine for dev.
"""
from __future__ import annotations

from typing import Any


class SqliteDriver:
    dialect = "sqlite"

    async def execute(
        self,
        sql_text: str,
        params: dict[str, Any] | None,
        *,
        fetch: str = "all",
    ) -> Any:
        raise NotImplementedError("SqliteDriver.execute")
