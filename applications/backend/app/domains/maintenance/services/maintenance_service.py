"""MaintenanceService - Module 33: asset upkeep plans + overdue sweeps."""
from __future__ import annotations
import logging
from datetime import date, timedelta
from typing import Any

from app.ports.persistence.maintenance_repository import MaintenanceRepositoryPort
from app.shared.exceptions.hierarchy import NotFoundError, ValidationError

logger = logging.getLogger(__name__)


class MaintenanceService:
    def __init__(self, plans: Any, notifications: Any | None = None) -> None:
        self._plans = plans
        self._notifications = notifications

    async def create_plan(self, customer_id: str, data: dict[str, Any]) -> dict[str, Any]:
        interval = int(data.get("interval_days") or 180)
        if not 1 <= interval <= 1095:
            raise ValidationError("interval_days must be between 1 and 1095")
        if not data.get("next_due_date"):
            data["next_due_date"] = (
                date.today() + timedelta(days=interval)).isoformat()
        row = await self._plans.create_plan(customer_id, data)
        if not row:
            raise ValidationError("Could not create the maintenance plan")
        return row

    async def list_plans(self, customer_id: str, page: int = 1, limit: int = 20) -> list[dict]:
        return await self._plans.list_plans(customer_id, page, limit)

    async def get_plan(self, customer_id: str, plan_id: str) -> dict[str, Any]:
        row = await self._plans.get_plan(customer_id, plan_id)
        if not row:
            raise NotFoundError("Maintenance plan not found")
        return row

    async def mark_done(self, customer_id: str, plan_id: str) -> dict[str, Any]:
        row = await self._plans.mark_done(customer_id, plan_id)
        if not row:
            raise ValidationError(
                "Plan not found, already done, or cancelled")
        return row

    async def cancel(self, customer_id: str, plan_id: str) -> dict[str, Any]:
        row = await self._plans.cancel(customer_id, plan_id)
        if not row:
            raise NotFoundError("Plan not found or already closed")

    # -- invoked by the SchedulerManager job JOB.MAINTENANCE.SWEEP --

    async def sweep_overdue(self, batch: int = 200) -> dict[str, int]:
        """Flag overdue ACTIVE plans (once) and notify their owners."""
        flagged_rows = await self._plans.flag_overdue()
        flagged = len(flagged_rows)
        # Notify only the plans this sweep flipped; already-flagged ones were
        # announced on an earlier pass.
        for plan in flagged_rows:
            if self._notifications is not None:
                try:
                    await self._notifications.notify(
                        str(plan["customer_id"]),
                        ntype="MAINTENANCE.OVERDUE",
                        title="Maintenance due",
                        body=f"Plan {plan['plan_number']} is past its due date.",
                        ref_type="MAINTENANCE_PLAN", ref_id=str(plan["plan_id"]),
                    )
                except Exception as exc:  # notify must never break the sweep
                    logger.warning("overdue notify failed: %s", exc)
        return {"flagged": flagged}
