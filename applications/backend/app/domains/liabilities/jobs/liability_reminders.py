"""Background job: JOB-LIA-PAYMENT-REMINDERS."""
from __future__ import annotations

JOB_ID = "JOB-LIA-PAYMENT-REMINDERS"
# Suggested schedule: daily_at("07:00") - upcoming payment reminders


class PaymentRemindersJob:
    """Long-running work executed OUTSIDE the HTTP request path."""

    async def run(self, context: dict) -> dict:
        """Execute the job; returns a result summary for logging/audit."""
        raise NotImplementedError("PaymentRemindersJob.run")
