"""OnboardingSqlAdapter — step catalogue + per-customer progress."""
from __future__ import annotations

from typing import Any

from app.platform.query.sql_query_manager import SQLQueryManager


class OnboardingQueryIds:
    STEPS = "CUS.ONBOARDING.STEPS.LIST"
    STATUS = "CUS.ONBOARDING.STATUS"
    COMPLETE = "CUS.ONBOARDING.STEP.COMPLETE"


class OnboardingSqlAdapter:
    def __init__(self, sql_manager: SQLQueryManager) -> None:
        self._sql = sql_manager

    async def steps(self) -> list[dict[str, Any]]:
        return await self._sql.execute(OnboardingQueryIds.STEPS) or []

    async def status(self, user_id: str) -> list[dict[str, Any]]:
        return await self._sql.execute(OnboardingQueryIds.STATUS, {"user_id": user_id}) or []

    async def complete_step(self, user_id: str, step_code: str) -> Any | None:
        return await self._sql.execute(
            OnboardingQueryIds.COMPLETE,
            {"user_id": user_id, "step_code": step_code},
            fetch="one",
        )