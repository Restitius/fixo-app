"""MySQL driver adapter (aiomysql via SQLAlchemy async engine).

Dialect notes:
    - Named ':param' binds supported.
    - Use LOWER(col) LIKE instead of ILIKE.
"""
from __future__ import annotations

from typing import Any


class MysqlDriver:
    dialect = "mysql"

    async def execute(
        self,
        sql_text: str,
        params: dict[str, Any] | None,
        *,
        fetch: str = "all",
    ) -> Any:
        raise NotImplementedError("MysqlDriver.execute")
