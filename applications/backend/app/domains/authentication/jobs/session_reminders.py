"""Background job: JOB-AUTH-ROTATE-SECRETS."""
from __future__ import annotations

JOB_ID = "JOB-AUTH-ROTATE-SECRETS"
# Suggested schedule: monthly cron - rotate JWT signing material


class RotateSigningSecretsJob:
    """Long-running work executed OUTSIDE the HTTP request path."""

    async def run(self, context: dict) -> dict:
        """Execute the job; returns a result summary for logging/audit."""
        raise NotImplementedError("RotateSigningSecretsJob.run")
