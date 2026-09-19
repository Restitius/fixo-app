"""Background job: JOB-USR-PRUNE-INACTIVE."""
from __future__ import annotations

JOB_ID = "JOB-USR-PRUNE-INACTIVE"
# Suggested schedule: weekly cron - anonymize long-dormant accounts


class PruneInactiveUsersJob:
    """Long-running work executed OUTSIDE the HTTP request path."""

    async def run(self, context: dict) -> dict:
        """Execute the job; returns a result summary for logging/audit."""
        raise NotImplementedError("PruneInactiveUsersJob.run")
