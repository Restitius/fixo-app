"""OnboardingService — guided step completion for new customers."""
from __future__ import annotations

import logging
from typing import Any

from app.shared.exceptions.hierarchy import NotFoundError, ValidationError

logger = logging.getLogger(__name__)


class OnboardingService:
    def __init__(self, onboarding: Any, events: Any) -> None:
        self._onboarding = onboarding
        self._events = events

    async def steps(self) -> list[dict[str, Any]]:
        return await self._onboarding.steps()

    async def status(self, user_id: str) -> dict[str, Any]:
        rows = await self._onboarding.status(user_id)
        required = [r for r in rows if r["is_required"]]
        done = all(r["completed"] for r in required)
        return {
            "steps": rows,
            "completed": done,
            "progress": f"{sum(1 for r in rows if r['completed'])}/{len(rows)}",
        }

    async def complete_step(self, user_id: str, step_code: str) -> dict[str, Any]:
        known = {s["code"] for s in await self._onboarding.steps()}
        if step_code not in known:
            raise NotFoundError(f"Unknown onboarding step '{step_code}'")

        row = await self._onboarding.complete_step(user_id, step_code)
        if not row:
            raise ValidationError("Step could not be completed")

        snapshot = await self.status(user_id)
        if snapshot["completed"]:
            await self._publish_completed(user_id)
        return {"step_code": step_code, **snapshot}

    async def _publish_completed(self, user_id: str) -> None:
        if self._events is None:
            return
        from app.events.event import make_event

        logger.info("customer %s completed onboarding", user_id)
        await self._events.publish(
            make_event("EVT.CUSTOMER.ONBOARDING_COMPLETED", {"customer_id": user_id})
        )
