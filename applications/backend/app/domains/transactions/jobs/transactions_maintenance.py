"""Background job: JOB-TRX-RECONCILE."""
from __future__ import annotations

JOB_ID = "JOB-TRX-RECONCILE"
# Suggested schedule: daily_at("02:00") - reconcile against integrations


class ReconcileTransactionsJob:
    """Long-running work executed OUTSIDE the HTTP request path."""

    async def run(self, context: dict) -> dict:
        """Execute the job; returns a result summary for logging/audit."""
        raise NotImplementedError("ReconcileTransactionsJob.run")
