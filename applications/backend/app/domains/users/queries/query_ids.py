"""Query ID constants for the users domain (section 6)."""
from __future__ import annotations


class UserQueries:
    # NOTE: USER.* statements are NOT yet governed in registry.yaml.
    # Add SQL under app/queries/ + manifest entries, then flip PENDING flags.
    LIST_PENDING = True
