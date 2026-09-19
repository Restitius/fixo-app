"""Background job: JOB-NTF-EXPIRE-STALE."""
from __future__ import annotations

JOB_ID = "JOB-NTF-EXPIRE-STALE"
# Suggested schedule: daily_at("03:00") - apply expiry policy


class ExpireStaleNotificationsJob:
    """Long-running work executed OUTSIDE the HTTP request path."""

    async def run(self, context: dict) -> dict:
        """Execute the job; returns a result summary for logging/audit."""
        raise NotImplementedError("ExpireStaleNotificationsJob.run")
