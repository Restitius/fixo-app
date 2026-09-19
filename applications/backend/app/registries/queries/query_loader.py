"""Query Loader — reads SQL text for a definition from the governed store.

The ONLY place in the application that turns a QueryDefinition into SQL text.
Disk IO is deferred to the persistence implementation phase; path resolution
and existence checks are available now for startup validation.
"""
from __future__ import annotations

from pathlib import Path

from app.registries.queries.query_definition import QueryDefinition

QUERIES_ROOT = Path(__file__).resolve().parents[2] / "queries"


class QueryLoader:
    """Loads and caches SQL text from 'app/queries/**/*.sql'."""

    def __init__(self, root: Path | None = None) -> None:
        self._root = root or QUERIES_ROOT
        self._cache: dict[str, str] = {}

    @property
    def root(self) -> Path:
        return self._root

    def resolve_path(self, definition: QueryDefinition) -> Path:
        """Absolute filesystem path of the SQL file for a definition."""
        return self._root / definition.sql_path

    def exists(self, definition: QueryDefinition) -> bool:
        """True when the SQL file for this definition is present on disk."""
        return self.resolve_path(definition).is_file()

    def load(self, definition: QueryDefinition) -> str:
        """Return raw SQL text for the definition (cached after first read)."""
        query_id = definition.query_id
        if query_id not in self._cache:
            path = self.resolve_path(definition)
            # utf-8-sig transparently drops a BOM if present.
            self._cache[query_id] = path.read_text(encoding="utf-8-sig")
        return self._cache[query_id]
