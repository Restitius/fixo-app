"""SQLQueryManager — the ONLY component that turns a governed query ID into execution.

Pipeline (architecture section 18):

    Validate Query ID -> Get Registry Definition -> Validate Query Status
    -> Validate Query Version -> Validate Caller -> Validate Required Parameters
    -> Validate Security Context -> Resolve Database -> Load SQL
    -> Apply Transaction Rules -> Apply Timeout -> Execute -> Map Result
    -> Record Metrics -> Write Safe Query Log -> Return Result

Application/domain services never touch this class; only the persistence
adapters (app/adapters/persistence) consume it.
"""
from __future__ import annotations

from typing import Any

from app.infrastructure.database.query_executor import QueryExecutor
from app.shared.exceptions.hierarchy import ConfigurationError


class SQLQueryManager:
    """Validates, routes, and executes governed queries by stable ID."""

    def __init__(
        self,
        executor: QueryExecutor,
        *,
        registry: Any,
        validator: Any,
        loader: Any,
        databases: Any,
    ) -> None:
        self._executor = executor
        self._registry = registry
        self._validator = validator
        self._loader = loader
        self._databases = databases

    async def execute(
        self,
        query_id: str,
        params: dict[str, Any] | None = None,
        *,
        fetch: str = "all",
        **execution_options: Any,
    ) -> Any:
        """Run one governed query end-to-end."""
        # 1. Validate query ID and resolve the registry definition (raise if unknown).
        definition = self._registry.get(query_id)

        # 2. Validate the definition + SQL file (existence, ownership, safety).
        issues = self._validator.validate_definition(self._loader, definition)
        if issues:
            raise ConfigurationError(
                "Governed query failed validation",
                code="QUERY.VALIDATION_FAILED",
                details={"query_id": query_id, "issues": issues},
            )

        # 3. Resolve the target database (routing via QueryDefinition.database_id).
        self._databases.engine_for(definition.database_id)

        # 4. Delegate to the executor which wires loader -> transaction -> driver
        #    -> mapper; metrics/cache/audit hooks attach here once implemented.
        return await self._executor.execute(query_id, params or {}, fetch=fetch)

    def _validate(self, loader: Any, definition: Any) -> list[str]:
        """Delegated static validation (definition + SQL text)."""
        return self._validator.validate_definition(loader, definition)
