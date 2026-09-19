"""Background job: JOB-AST-REMINDERS."""
from __future__ import annotations

JOB_ID = "JOB-AST-REMINDERS"
# Suggested schedule: daily_at("08:30")


class AssetRemindersJob:
    """Long-running work executed OUTSIDE the HTTP request path."""

    async def run(self, context: dict) -> dict:
        """Execute the job; returns a result summary for logging/audit."""
        raise NotImplementedError("AssetRemindersJob.run")
