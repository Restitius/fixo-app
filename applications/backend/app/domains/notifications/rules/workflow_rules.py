"""Notification workflow/state-transition rules (pure predicates)."""
from __future__ import annotations


def dedupe_window_respected(seconds_since_last: float, window_seconds: int) -> bool:
    """Suppress duplicates inside the configured window."""
    return seconds_since_last >= window_seconds


def recipient_must_own_notification(recipient_id: str, owner_id: str) -> bool:
    """Only the recipient may mutate a notification."""
    return str(recipient_id) == str(owner_id)
