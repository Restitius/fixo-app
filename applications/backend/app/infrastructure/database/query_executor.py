"""QueryExecutor — the ONLY component that turns a Query ID into results.

Pipeline (architecture section 5):

    Query ID
      --> QueryRegistry.get(id)              -> QueryDefinition
      --> QueryLoader.load(definition)       -> SQL text
      --> DatabaseManager.engine_for(db_id)  -> routed driver/engine
      --> driver.execute(sql, params, fetch) -> raw rows/status
      --> ResultMapper                       -> dicts / scalars

Services NEVER see SQL text; they only pass IDs and parameters.
"""
from __future__ import annotations

from typing import Any, Literal

from sqlalchemy import text

from app.infrastructure.database.manager import DatabaseManager
from app.infrastructure.database.result_mapper import ResultMapper
from app.registries.queries.query_loader import QueryLoader
from app.registries.queries.query_registry import QueryRegistry

FetchMode = Literal["one", "all", "scalar", "status"]


class QueryExecutor:
    """Executes governed queries by stable ID against routed databases."""

    def __init__(
        self,
        registry: QueryRegistry,
        loader: QueryLoader,
        databases: DatabaseManager,
        mapper: ResultMapper | None = None,
    ) -> None:
        self._registry = registry
        self._loader = loader
        self._databases = databases
        self._mapper = mapper or ResultMapper()

    async def execute(
        self,
        query_id: str,
        params: dict[str, Any] | None = None,
        *,
        fetch: FetchMode = "all",
    ) -> Any:
        """Run a governed query.

        Args:
            query_id: Stable registry ID, e.g. ASSET.GET_BY_ID.
            params:   Bind parameters (must include ownership filters where
                      the definition demands them).
            fetch:    one | all | scalar | status.
        """
        definition = self._registry.get(query_id)
        sql_text = self._loader.load(definition)
        engine = self._databases.engine_for(definition.database_id)

        async with engine.begin() as conn:
            result = await conn.execute(text(sql_text), params or {})
            if fetch == "status":
                return result.rowcount
            if fetch == "scalar":
                return self._mapper.sanitize(result.scalar())
            if fetch == "one":
                row = result.mappings().first()
                return self._mapper.sanitize(dict(row)) if row else None
            return self._mapper.to_dicts(result.mappings())

    async def execute_many(
        self,
        query_id: str,
        param_rows: list[dict[str, Any]],
    ) -> Any:
        """Batch execution of one governed statement over many parameter rows."""
        definition = self._registry.get(query_id)
        sql_text = self._loader.load(definition)
        engine = self._databases.engine_for(definition.database_id)

        async with engine.begin() as conn:
            result = await conn.execute(text(sql_text), param_rows)
            return result.rowcount
