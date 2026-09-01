"""Background job: JOB-LIA-RECALC-SCHEDULES."""
from __future__ import annotations

JOB_ID = "JOB-LIA-RECALC-SCHEDULES"
# Suggested schedule: daily_at("00:30") - refresh amortization projections


class RecalculateSchedulesJob:
    """Long-running work executed OUTSIDE the HTTP request path."""

    async def run(self, context: dict) -> dict:
        """Execute the job; returns a result summary for logging/audit."""
        raise NotImplementedError("RecalculateSchedulesJob.run")
