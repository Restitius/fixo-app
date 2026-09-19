"""User workflow/state-transition rules (pure predicates)."""
from __future__ import annotations


def deactivation_requires_no_active_sessions(active_sessions: int) -> bool:
    """Accounts with live sessions must revoke them before deactivation."""
    return active_sessions == 0


def password_change_requires_current(provided_current: bool) -> bool:
    """Password changes must present the current password."""
    return provided_current
