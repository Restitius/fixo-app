"""Retry policy + exponential backoff computation (pure)."""
from __future__ import annotations

import random
from dataclasses import dataclass


@dataclass(frozen=True)
class RetryPolicy:
    max_attempts: int = 3
    base_delay_seconds: float = 1.0
    max_delay_seconds: float = 60.0
    jitter: bool = True


def should_retry(attempt: int, policy: RetryPolicy) -> bool:
    """attempt is 1-based count of tries already consumed."""
    return attempt < policy.max_attempts


def compute_backoff(attempt: int, policy: RetryPolicy) -> float:
    """Exponential backoff with cap and optional jitter (pure)."""
    delay = min(policy.base_delay_seconds * (2 ** max(0, attempt - 1)), policy.max_delay_seconds)
    if policy.jitter:
        delay *= random.uniform(0.5, 1.5)
    return round(delay, 3)
