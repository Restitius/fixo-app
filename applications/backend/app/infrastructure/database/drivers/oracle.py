"""Oracle driver adapter (oracledb thin mode) — LEGACY_ORACLE target.

Dialect notes:
    - Bind style ':name' supported.
    - FETCH FIRST n ROWS ONLY instead of LIMIT.
    - Uppercase identifier folding applies.
"""
from __future__ import annotations

from typing import Any


class OracleDriver:
    dialect = "oracle"

    async def execute(
        self,
        sql_text: str,
        params: dict[str, Any] | None,
        *,
        fetch: str = "all",
    ) -> Any:
        raise NotImplementedError("OracleDriver.execute")
