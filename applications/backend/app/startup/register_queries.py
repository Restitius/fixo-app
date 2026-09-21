"""Query registration — parse registry.yaml, validate SQL files, populate.

This makes the Query Registry REAL at boot: every manifest entry becomes a
QueryDefinition; missing files or unsafe SQL surface as startup errors.
"""
from __future__ import annotations

import logging
from pathlib import Path
from typing import Any

logger = logging.getLogger(__name__)

MANIFEST_PATH = Path(__file__).resolve().parents[1] / "queries" / "registry.yaml"


def load_query_registry(query_registry: Any, manifest_path: Path | None = None) -> list[str]:
    """Load manifest entries into the registry; returns validation issues."""
    import yaml

    from app.registries.queries.query_definition import (
        CachePolicy,
        QueryDefinition,
        QuerySecurity,
    )
    from app.registries.queries.query_loader import QueryLoader
    from app.registries.queries.query_validator import QueryValidator

    path = manifest_path or MANIFEST_PATH
    loader = QueryLoader()
    validator = QueryValidator()
    issues: list[str] = []

    document = yaml.safe_load(path.read_text(encoding="utf-8")) or {}
    defaults = document.get("defaults", {}) or {}
    default_security = defaults.get("security", {}) or {}

    for query_id, entry in (document.get("queries") or {}).items():
        security_raw = {**default_security, **(entry.get("security") or {})}
        cache_raw = entry.get("cache") or {}
        definition = QueryDefinition(
            query_id=query_id,
            sql_path=entry["sql"],
            database_id=entry.get("database", defaults.get("database", "PRIMARY_DB")),
            operation=entry.get("operation", defaults.get("operation", "read")),
            timeout_ms=int(entry.get("timeout_ms", defaults.get("timeout_ms", 5000))),
            description=entry.get("description", ""),
            cache=CachePolicy(**cache_raw) if cache_raw else None,
            security=QuerySecurity(**security_raw),
        )
        query_registry.register(definition)
        issues.extend(validator.validate_definition(loader, definition))

    logger.info("query registry loaded: %s queries", query_registry.count())
    return issues
