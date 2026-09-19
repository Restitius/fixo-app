"""Cross-domain enumerations."""
from __future__ import annotations

from enum import Enum


class Environment(str, Enum):
    DEVELOPMENT = "development"
    TEST = "test"
    STAGING = "staging"
    PRODUCTION = "production"


class DatabaseId(str, Enum):
    """Logical databases routable via the Query Registry (§14-§15)."""

    PRIMARY_DB = "PRIMARY_DB"
    ANALYTICS_DB = "ANALYTICS_DB"
    AUDIT_DB = "AUDIT_DB"
    REPORTING_DB = "REPORTING_DB"
    LEGACY_ORACLE = "LEGACY_ORACLE"


class OperationType(str, Enum):
    CREATE = "create"
    READ = "read"
    UPDATE = "update"
    DELETE = "delete"
    EXECUTE = "execute"


class SortOrder(str, Enum):
    ASC = "asc"
    DESC = "desc"
