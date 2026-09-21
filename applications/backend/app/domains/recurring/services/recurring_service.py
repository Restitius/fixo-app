"""RecurringService - Module 31: subscription lifecycle + scheduler generation."""
from __future__ import annotations

import logging
from datetime import date, timedelta
from typing import Any

from app.shared.exceptions.hierarchy import NotFoundError, ValidationError

logger = logging.getLogger(__name__)

FREQUENCIES = {"WEEKLY", "BIWEEKLY", "MONTHLY", "QUARTERLY"}
# WF.RECURRING.V1 - registered transitions.
TRANSITIONS = {
    "ACTIVE": {"PAUSED", "CANCELLED"},
    "PAUSED": {"ACTIVE", "CANCELLED"},
    "CANCELLED": set(),
}


class RecurringService:
    def __init__(self, recurrings: Any) -> None:
        self._recurrings = recurrings

    async def create(self, customer_id: str, data: dict[str, Any]) -> dict[str, Any]:
        if data["frequency"] not in FREQUENCIES:
            raise ValidationError(f"frequency must be one of {sorted(FREQUENCIES)}")
        if "next_run_date" not in data or not data["next_run_date"]:
            data["next_run_date"] = (date.today() + timedelta(days=7)).isoformat()
        row = await self._recurrings.create(customer_id, data)
        if not row:
            raise ValidationError("Could not create the subscription")
        return row

    async def list(self, customer_id: str, page: int = 1, limit: int = 20) -> list[dict]:
        return await self._recurrings.list(customer_id, page, limit)

    async def get(self, customer_id: str, recurring_id: str) -> dict[str, Any]:
        row = await self._recurrings.get(customer_id, recurring_id)
        if not row:
            raise NotFoundError("Subscription not found")
        return row

    async def transition(self, customer_id: str, recurring_id: str,
                         to_state: str) -> dict[str, Any]:
        current = await self.get(customer_id, recurring_id)
        frm = current["status"]
        if to_state not in TRANSITIONS.get(frm, set()):
            raise ValidationError(
                f"Transition {frm} -> {to_state} is not allowed")
        row = await self._recurrings.set_status(
            customer_id, recurring_id, frm, to_state)
        if not row:
            raise ValidationError("Status changed concurrently - retry")
        return row

    # -- invoked by the SchedulerManager job JOB.RECURRING.GENERATE --

    async def generate_due(self, batch: int = 100) -> dict[str, int]:
        """Materialize DRAFT requests for every due ACTIVE subscription."""
        due = await self._recurrings.due(limit=batch)
        created = skipped = 0
        for item in due:
            result = await self._recurrings.generate_request(item["recurring_id"])
            if result:
                created += 1
                logger.info("recurring %s generated request %s",
                            item["recurring_number"], result.get("request_number"))
            else:
                skipped += 1
        return {"due": len(due), "created": created, "skipped": skipped}
