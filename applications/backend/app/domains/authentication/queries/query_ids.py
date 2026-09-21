"""Query ID constants for the authentication domain (section 6)."""
from __future__ import annotations


class SessionQueries:
    # NOTE: AUTH.* statements are NOT yet governed in registry.yaml.
    # Add SQL under app/queries/ + manifest entries, then flip PENDING flags.
    LIST_PENDING = True
