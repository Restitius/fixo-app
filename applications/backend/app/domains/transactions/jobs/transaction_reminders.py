"""Background job: JOB-TRX-REMINDERS."""
from __future__ import annotations

JOB_ID = "JOB-TRX-REMINDERS"
# Suggested schedule: every_minutes(720) - remind about unsettled items


class TransactionRemindersJob:
    """Long-running work executed OUTSIDE the HTTP request path."""

    async def run(self, context: dict) -> dict:
        """Execute the job; returns a result summary for logging/audit."""
        raise NotImplementedError("TransactionRemindersJob.run")
