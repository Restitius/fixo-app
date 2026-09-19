"""Background job: JOB-NTF-DISPATCH-PENDING."""
from __future__ import annotations

JOB_ID = "JOB-NTF-DISPATCH-PENDING"
# Suggested schedule: every_minutes(1) - drain outbound queue


class DispatchPendingNotificationsJob:
    """Long-running work executed OUTSIDE the HTTP request path."""

    async def run(self, context: dict) -> dict:
        """Execute the job; returns a result summary for logging/audit."""
        raise NotImplementedError("DispatchPendingNotificationsJob.run")
