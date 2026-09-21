"""Background job: JOB-USR-DIGEST."""
from __future__ import annotations

JOB_ID = "JOB-USR-DIGEST"
# Suggested schedule: daily_at("08:00") - optional activity digest emails


class UserDigestJob:
    """Long-running work executed OUTSIDE the HTTP request path."""

    async def run(self, context: dict) -> dict:
        """Execute the job; returns a result summary for logging/audit."""
        raise NotImplementedError("UserDigestJob.run")
