"""User business rules (pure predicates — enforce BEFORE persistence)."""
from __future__ import annotations

def email_format_valid(email: str) -> bool:
    """Basic RFC-style shape check (full validation at schema layer)."""
    import re
    return re.match(r"^[^@\s]+@[^@\s]+\.[^@\s]+$", email or "") is not None


def username_min_length(username: str, minimum: int = 3) -> bool:
    """Usernames must meet the minimum length."""
    return len(username or "") >= minimum
