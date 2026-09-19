"""Cache key conventions (pure)."""
from __future__ import annotations

import hashlib
import json


def build(template: str, **params: object) -> str:
    """Fill a '{placeholder}' template, e.g. build('asset:{user_id}', user_id=7)."""
    return template.format(**params)


def query_key(query_id: str, params: dict[str, object] | None = None) -> str:
    """Deterministic cache key for a governed query execution."""
    basis = json.dumps(params or {}, sort_keys=True, default=str)
    digest = hashlib.sha1(basis.encode()).hexdigest()[:16]
    return f"qry:{query_id.lower()}:{digest}"


def event_invalidation_prefix(module: str) -> str:
    return f"{module}:"
