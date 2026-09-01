"""PostgreSQL driver adapter (asyncpg via SQLAlchemy async engine).

Dialect notes:
    - Named ':param' binds supported natively.
    - ILIKE available for case-insensitive search.
    - NULLS LAST ordering supported.
"""
from __future__ import annotations

from typing import Any


class PostgresDriver:
    """Concrete driver for PRIMARY_DB / ANALYTICS_DB / REPORTING_DB."""

    dialect = "postgresql"

    async def execute(
        self,
        sql_text: str,
        params: dict[str, Any] | None,
        *,
        fetch: str = "all",
    ) -> Any:
        raise NotImplementedError("PostgresDriver.execute")
