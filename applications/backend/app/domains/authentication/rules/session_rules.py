"""Authentication business rules (pure predicates — enforce BEFORE persistence)."""
from __future__ import annotations

def lockout_after_threshold(failed_count: int, threshold: int = 5) -> bool:
    """Lock the account once failures reach the threshold."""
    return failed_count >= threshold


def token_expiry_enforced(expires_at, now) -> bool:
    """Tokens past expiry are always rejected."""
    return expires_at is not None and now is not None and now >= expires_at
