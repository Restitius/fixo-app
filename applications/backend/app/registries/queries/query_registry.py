"""Query Registry — central catalogue of governed queries (pure mechanics)."""
from __future__ import annotations

from app.registries.queries.query_definition import QueryDefinition
from app.shared.exceptions.hierarchy import ConfigurationError


class QueryRegistry:
    """Registers and resolves QueryDefinition objects by stable ID."""

    def __init__(self) -> None:
        self._queries: dict[str, QueryDefinition] = {}

    def register(self, definition: QueryDefinition, *, override: bool = False) -> None:
        """Register a definition; duplicate IDs are rejected unless overridden."""
        if definition.query_id in self._queries and not override:
            raise ConfigurationError(
                f"Query already registered: {definition.query_id}",
                code="REGISTRY.DUPLICATE_QUERY",
            )
        self._queries[definition.query_id] = definition

    def get(self, query_id: str) -> QueryDefinition:
        """Resolve a query ID to its definition (raises ConfigurationError if unknown)."""
        try:
            return self._queries[query_id]
        except KeyError:
            raise ConfigurationError(
                f"Query not registered: {query_id}",
                code="REGISTRY.UNKNOWN_QUERY",
            ) from None

    def exists(self, query_id: str) -> bool:
        return query_id in self._queries

    def all_ids(self) -> list[str]:
        return sorted(self._queries)

    def find_by_database(self, database_id: str) -> list[QueryDefinition]:
        """All definitions targeting a given database (multi-DB routing, §15)."""
        return [d for d in self._queries.values() if d.database_id == database_id]

    def count(self) -> int:
        return len(self._queries)
