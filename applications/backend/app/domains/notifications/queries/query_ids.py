"""Query ID constants for the notifications domain (section 6)."""
from __future__ import annotations


class NotificationQueries:
    # NOTE: NOTIFICATION.* statements are NOT yet governed in registry.yaml.
    # Add SQL under app/queries/ + manifest entries, then flip PENDING flags.
    LIST_PENDING = True
