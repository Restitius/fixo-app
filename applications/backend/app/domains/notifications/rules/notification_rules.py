"""Notification business rules (pure predicates — enforce BEFORE persistence)."""
from __future__ import annotations


def critical_never_auto_expired(priority: str) -> bool:
    """CRITICAL alerts bypass expiry until acknowledged."""
    return priority != "CRITICAL"


def read_is_terminal_for_escalation(status: str) -> bool:
    """READ/DISMISSED notifications leave the escalation pipeline."""
    return status in {"READ", "DISMISSED"}
