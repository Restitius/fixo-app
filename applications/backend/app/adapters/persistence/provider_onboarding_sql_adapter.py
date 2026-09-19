"""ProviderOnboardingSqlAdapter — step catalogue + auto-saved progress."""
from __future__ import annotations

import json
from typing import Any

from app.platform.query.sql_query_manager import SQLQueryManager


class ProviderOnboardingQueryIds:
    STEPS = "PROV.ONBOARD.STEPS.LIST"
    STATUS = "PROV.ONBOARD.STATUS"
    SAVE = "PROV.ONBOARD.STEP.SAVE"
    COMPLETE = "PROV.ONBOARD.STEP.COMPLETE"


class ProviderOnboardingSqlAdapter:
    def __init__(self, sql_manager: SQLQueryManager) -> None:
        self._sql = sql_manager

    async def steps(self) -> list[dict[str, Any]]:
        return await self._sql.execute(ProviderOnboardingQueryIds.STEPS) or []

    async def status(self, provider_id: str) -> list[dict[str, Any]]:
        return await self._sql.execute(
            ProviderOnboardingQueryIds.STATUS, {"user_id": provider_id}
        ) or []

    async def save_step(
        self, provider_id: str, step_code: str, data: dict[str, Any]
    ) -> Any | None:
        return await self._sql.execute(
            ProviderOnboardingQueryIds.SAVE,
            {
                "user_id": provider_id,
                "step_code": step_code,
                "step_data": json.dumps(data or {}),
            },
            fetch="one",
        )

    async def complete_step(
        self, provider_id: str, step_code: str, data: dict[str, Any]
    ) -> Any | None:
        return await self._sql.execute(
            ProviderOnboardingQueryIds.COMPLETE,
            {
                "user_id": provider_id,
                "step_code": step_code,
                "step_data": json.dumps(data or {}),
            },
            fetch="one",
        )
