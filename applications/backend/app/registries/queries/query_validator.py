"""Query Validator — static, deterministic safety checks on governed SQL.

Enforces architecture rule (§26): ownership filtering must be present in the
SQL itself for read/update/delete operations on user-scoped resources.
No database connection is required — these are textual/structural checks.
"""
from __future__ import annotations

import re

from app.registries.queries.query_definition import QueryDefinition
from app.registries.queries.query_loader import QueryLoader

_FORBIDDEN_PATTERNS: tuple[tuple[str, str], ...] = (
    (r";\s*;", "stacked empty statements"),
    (r"\bdrop\s+table\b", "DROP TABLE"),
    (r"\btruncate\s+table\b", "TRUNCATE TABLE"),
    (r"\bgrant\b", "GRANT"),
)

_OPERATION_HEADS: dict[str, tuple[str, ...]] = {
    # 'with' allowed: CTE-wrapped statements keep multi-step writes atomic.
    "create": ("insert", "with"),
    "read": ("select", "with"),
    "update": ("update", "with"),
    # 'update' == soft-delete/archive convention; 'delete' allowed when the
    # resource has no historical references (e.g. property rooms).
    "delete": ("update", "delete"),
    "execute": ("call", "select", "insert", "update"),
}


class QueryValidator:
    """Validates definitions and their SQL text at registration/startup time."""

    def validate_text(self, sql_text: str, definition: QueryDefinition) -> list[str]:
        """Return a list of human-readable issues (empty list == valid)."""
        issues: list[str] = []
        lowered = sql_text.lower()

        for pattern, label in _FORBIDDEN_PATTERNS:
            if re.search(pattern, lowered):
                issues.append(f"{definition.query_id}: forbidden pattern ({label})")

        # Ignore comment lines so a leading '--' header doesn't mask the head.
        code_lines = [
            line for line in sql_text.strip().splitlines()
            if line.strip() and not line.strip().startswith("--")
        ]
        stripped = "\n".join(code_lines).strip().rstrip(";").strip()
        head = stripped.split(None, 1)[0].lower() if stripped else "<empty>"
        allowed_heads = _OPERATION_HEADS.get(definition.operation, ())
        if allowed_heads and head not in allowed_heads:
            issues.append(
                f"{definition.query_id}: operation '{definition.operation}' "
                f"but statement starts with '{head}'"
            )

        if (
            definition.security.ownership_filter_required
            and definition.operation in {"read", "update", "delete"}
            and not any(
                f":{name}" in sql_text
                for name in ("user_id", "customer_id", "tenant_id")
            )
        ):
            issues.append(
                f"{definition.query_id}: ownership filter required "
                "(expected :user_id, :customer_id or :tenant_id bind parameter)"
            )

        return issues

    def validate_definition(self, loader: QueryLoader, definition: QueryDefinition) -> list[str]:
        """Validate a definition against its SQL file (existence + content)."""
        if not loader.exists(definition):
            return [f"{definition.query_id}: SQL file missing: {definition.sql_path}"]
        sql_text = loader.resolve_path(definition).read_text(encoding="utf-8-sig")
        return self.validate_text(sql_text, definition)
