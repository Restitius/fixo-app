"""Expiry policy — notifications auto-expire after TTL (pure decision)."""
from __future__ import annotations

from datetime import datetime, timedelta, timezone


class ExpiryPolicy:
    def __init__(self, default_ttl_hours: int = 72) -> None:
        self.default_ttl_hours = default_ttl_hours

    def expires_at(self, created_at: datetime, ttl_hours: int | None = None) -> datetime:
        ttl = ttl_hours if ttl_hours is not None else self.default_ttl_hours
        return created_at + timedelta(hours=ttl)

    def is_expired(self, created_at: datetime, now: datetime | None = None, ttl_hours: int | None = None) -> bool:
        moment = now or datetime.now(timezone.utc)
        return moment >= self.expires_at(created_at, ttl_hours)
