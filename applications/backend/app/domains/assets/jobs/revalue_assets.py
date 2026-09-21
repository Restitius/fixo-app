"""Background job: JOB-AST-REVALUE."""
from __future__ import annotations

JOB_ID = "JOB-AST-REVALUE"
# Suggested schedule: daily_at("00:10")


class RevalueAssetsJob:
    """Long-running work executed OUTSIDE the HTTP request path."""

    async def run(self, context: dict) -> dict:
        """Execute the job; returns a result summary for logging/audit."""
        raise NotImplementedError("RevalueAssetsJob.run")
