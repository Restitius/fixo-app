"""DatabaseManager — owns engines/sessions for one or more logical databases.

Multi-database routing (architecture sections 14-15):

    Query ID --> QueryDefinition.database_id --> DatabaseManager --> Driver

Logical IDs live in shared.enums.common.DatabaseId:
PRIMARY_DB | ANALYTICS_DB | AUDIT_DB | REPORTING_DB | LEGACY_ORACLE
"""
from __future__ import annotations

from typing import Any

from sqlalchemy import text

from app.shared.enums.common import DatabaseId


class DatabaseManager:
    """Registers one engine per logical database and routes executions."""

    def __init__(self) -> None:
        self._engines: dict[str, Any] = {}

    def register_database(self, database_id: str | DatabaseId, engine: Any) -> None:
        """Attach an engine/driver to a logical database id."""
        key = str(database_id)
        if key in self._engines:
            raise ValueError(f"Database already registered: {key}")
        self._engines[key] = engine

    def engine_for(self, database_id: str | DatabaseId) -> Any:
        """Return the engine bound to a logical database id."""
        key = str(database_id)
        try:
            return self._engines[key]
        except KeyError:
            raise LookupError(
                f"No engine registered for database '{key}'. "
                f"Known: {sorted(self._engines)}"
            ) from None

    def known_databases(self) -> list[str]:
        return sorted(self._engines)

    async def health(self) -> dict[str, bool]:
        """Liveness per registered database (SELECT 1 style probes)."""
        results: dict[str, bool] = {}
        for key, engine in self._engines.items():
            try:
                async with engine.connect() as conn:
                    await conn.execute(text("SELECT 1"))
                results[key] = True
            except Exception:
                results[key] = False
        return results

    async def dispose(self) -> None:
        """Dispose all engines on shutdown."""
        for engine in self._engines.values():
            await engine.dispose()
