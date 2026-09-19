"""Background job: JOB-AUTH-PURGE-SESSIONS."""
from __future__ import annotations

JOB_ID = "JOB-AUTH-PURGE-SESSIONS"
# Suggested schedule: every_minutes(60) - delete expired session rows


class PurgeExpiredSessionsJob:
    """Long-running work executed OUTSIDE the HTTP request path."""

    async def run(self, context: dict) -> dict:
        """Execute the job; returns a result summary for logging/audit."""
        raise NotImplementedError("PurgeExpiredSessionsJob.run")
