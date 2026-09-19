"""Authentication workflow/state-transition rules (pure predicates)."""
from __future__ import annotations


def password_min_requirements(password: str) -> bool:
    """Minimum length plus mixed character classes."""
    import re
    if len(password or "") < 10:
        return False
    return bool(re.search(r"[A-Z]", password)) and bool(re.search(r"[a-z]", password)) and bool(re.search(r"[0-9]", password))


def refresh_rotation_required(reuse_detected: bool) -> bool:
    """Refresh-token reuse forces revocation of the family."""
    return reuse_detected
