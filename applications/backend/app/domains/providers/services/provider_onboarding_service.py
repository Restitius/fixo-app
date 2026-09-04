"""ProviderOnboardingService — guided 7-step onboarding with auto-save (Phase 2).

Mirrors the customer OnboardingService and adds:
- per-step data capture (auto-save; providers can leave and continue later),
- resume point (`current_step` = first incomplete required step).
Depends ONLY on ports + events — no SQL, no query IDs.
"""
from __future__ import annotations

import logging
from typing import Any

from app.shared.exceptions.hierarchy import NotFoundError, ValidationError

logger = logging.getLogger(__name__)


class ProviderOnboardingService:
    def __init__(self, onboarding: Any, events: Any) -> None:
        self._onboarding = onboarding
        self._events = events

    async def steps(self) -> list[dict[str, Any]]:
        return await self._onboarding.steps()

    async def status(self, provider_id: str) -> dict[str, Any]:
        rows = await self._onboarding.status(provider_id)
        required = [r for r in rows if r["is_required"]]
        done = all(r["completed"] for r in required)
        current = next(
            (r for r in rows if r["is_required"] and not r["completed"]), None
        )
        return {
            "steps": rows,
            "completed": done,
            "progress": f"{sum(1 for r in rows if r['completed'])}/{len(rows)}",
            "current_step": current["code"] if current else None,
        }

    async def save_step(
        self, provider_id: str, step_code: str, data: dict[str, Any] | None
    ) -> dict[str, Any]:
        await self._require_step(step_code)
        row = await self._onboarding.save_step(
            provider_id, step_code, self._as_dict(data)
        )
        if not row:
            raise ValidationError("Step data could not be saved")
        return {"step_code": step_code, "saved": True, **await self.status(provider_id)}

    async def complete_step(
        self, provider_id: str, step_code: str, data: dict[str, Any] | None
    ) -> dict[str, Any]:
        await self._require_step(step_code)
        row = await self._onboarding.complete_step(
            provider_id, step_code, self._as_dict(data)
        )
        if not row:
            raise ValidationError("Step could not be completed")

        snapshot = await self.status(provider_id)
        if snapshot["completed"]:
            await self._publish_completed(provider_id)
        return {"step_code": step_code, **snapshot}

    # -- internals -------------------------------------------------------------

    async def _require_step(self, step_code: str) -> None:
        known = {s["code"] for s in await self._onboarding.steps()}
        if step_code not in known:
            raise NotFoundError(f"Unknown onboarding step '{step_code}'")

    @staticmethod
    def _as_dict(data: dict[str, Any] | None) -> dict[str, Any]:
        if data is None:
            return {}
        if not isinstance(data, dict):
            raise ValidationError("Step data must be a JSON object")
        return data

    async def _publish_completed(self, provider_id: str) -> None:
        if self._events is None:
            return
        from app.events.event import make_event

        logger.info("provider %s completed onboarding", provider_id)
        await self._events.publish(
            make_event("EVT.PROVIDER.ONBOARDING_COMPLETED", {"provider_id": provider_id})
        )
