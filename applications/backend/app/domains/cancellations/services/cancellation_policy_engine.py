"""Cancellation fee policy - pure domain, no I/O."""
from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime


@dataclass(frozen=True)
class CancellationOutcome:
    fee: float
    tier: str
    explanation: str


class CancellationPolicyEngine:
    """Fees fall as notice grows: <2h 40%, <24h 20%, <72h 10%, else free."""

    def evaluate(
        self,
        scheduled_date: datetime | str | None,
        agreed_amount: float,
        now: datetime | None = None,
    ) -> CancellationOutcome:
        amount = float(agreed_amount or 0)
        if scheduled_date is None:
            return CancellationOutcome(0.0, "FREE", "No schedule recorded; no fee applies")
        if isinstance(scheduled_date, str):
            from datetime import datetime as _dt

            scheduled = _dt.fromisoformat(scheduled_date)
            if scheduled.tzinfo is not None:
                scheduled = scheduled.astimezone().replace(tzinfo=None)
        else:
            scheduled = scheduled_date.replace(tzinfo=None)
        ref = (now or datetime.now()).replace(tzinfo=None)
        hours = max((scheduled - ref).total_seconds() / 3600.0, 0.0)
        if hours < 2:
            tier, rate, note = "LATE", 0.40, "Cancelled under 2 hours before the visit"
        elif hours < 24:
            tier, rate, note = "SHORT_NOTICE", 0.20, "Cancelled under 24 hours before the visit"
        elif hours < 72:
            tier, rate, note = "STANDARD", 0.10, "Cancelled under 72 hours before the visit"
        else:
            tier, rate, note = "FREE", 0.0, "Plenty of notice; no fee applies"
        fee = round(amount * rate, 2)
        return CancellationOutcome(fee, tier, f"{note} ({int(rate * 100)}% of {amount:,.0f} TZS)")
