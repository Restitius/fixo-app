"""QueryDefinition — the immutable governance record for one SQL statement.

Flow position (§5):

    Query ID --> QueryRegistry --> QueryDefinition --> QueryLoader --> SQL file
                                                                  --> QueryExecutor
"""
from __future__ import annotations

from dataclasses import dataclass, field


@dataclass(frozen=True)
class CachePolicy:
    """Cache rules attached to a query."""

    enabled: bool = False
    ttl_seconds: int = 60
    key_template: str = ""  # e.g. "asset:{user_id}:{asset_id}"
    invalidate_on_events: tuple[str, ...] = ()


@dataclass(frozen=True)
class QuerySecurity:
    """Security rules enforced before a query may run."""

    requires_auth: bool = True
    ownership_filter_required: bool = True  # SQL must scope by :user_id / :tenant_id
    allowed_roles: tuple[str, ...] = ()


@dataclass(frozen=True)
class QueryDefinition:
    """Stable-ID description of a governed query.

    Attributes:
        query_id:     Stable ID, e.g. 'ASSET.GET_BY_ID'.
        sql_path:     Path relative to 'app/queries/', e.g. 'assets/read/find_asset.sql'.
        database_id:  Target database (see 'shared.enums.common.DatabaseId').
        operation:    create | read | update | delete | execute.
        timeout_ms:   Execution budget before cancellation.
        cache:        Optional CachePolicy.
        security:     Auth/ownership requirements validated by QueryValidator.
    """

    query_id: str
    sql_path: str
    database_id: str = "PRIMARY_DB"
    operation: str = "read"
    timeout_ms: int = 5_000
    description: str = ""
    cache: CachePolicy | None = None
    security: QuerySecurity = field(default_factory=QuerySecurity)
