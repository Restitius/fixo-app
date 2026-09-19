"""Log categories — one file per concern (section 21)."""
from __future__ import annotations

from enum import Enum


class Category(str, Enum):
    APPLICATION = "application"
    API = "api"
    DATABASE = "database"
    QUERY = "query"
    INTEGRATION = "integration"
    SECURITY = "security"
    EVENTS = "events"
    JOBS = "jobs"
    NOTIFICATIONS = "notifications"
    ERRORS = "errors"
    AUDIT_TRAIL = "audit"


FILENAMES: dict[Category, str] = {
    Category.APPLICATION: "application.log",
    Category.API: "api.log",
    Category.DATABASE: "database.log",
    Category.QUERY: "query.log",
    Category.INTEGRATION: "integration.log",
    Category.SECURITY: "security.log",
    Category.EVENTS: "events.log",
    Category.JOBS: "jobs.log",
    Category.NOTIFICATIONS: "notifications.log",
    Category.ERRORS: "errors.log",
    Category.AUDIT_TRAIL: "audit.log",
}


def filename_for(category: Category) -> str:
    return FILENAMES[category]
