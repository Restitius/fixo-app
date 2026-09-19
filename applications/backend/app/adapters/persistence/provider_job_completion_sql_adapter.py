"""ProviderJobCompletionSqlAdapter — implemented via governed queries (Phase 25).

The only code that knows PROV.COMPLETION.* query ids. Before/after
evidence references are serialised here as a JSON array (typically
Phase 22 evidence media_urls or evidence_ids). The submit is atomic:
report INSERT + booking transition to COMPLETION_REQUESTED.
"""
from __future__ import annotations

import json
from typing import Any


class ProviderJobCompletionQueryIds:
    SUBMIT = "PROV.COMPLETION.SUBMIT"
    GET = "PROV.COMPLETION.GET"


class ProviderJobCompletionSqlAdapter:
    def __init__(self, sql_query_manager: Any) -> None:
        self._sql = sql_query_manager

    async def submit(
        self,
        provider_id: str,
        booking_id: str,
        params: dict[str, Any],
    ) -> dict[str, Any] | None:
        return await self._sql.execute(
            ProviderJobCompletionQueryIds.SUBMIT,
            {
                "user_id": provider_id,
                "booking_id": booking_id,
                "completion_notes": params.get("completion_notes"),
                "work_performed": params.get("work_performed"),
                "materials_summary": params.get("materials_summary"),
                "before_after_evidence": json.dumps(
                    params.get("before_after_evidence") or []
                ),
                "warranty_details": params.get("warranty_details"),
                "recommended_followup": params.get("recommended_followup"),
                "maintenance_recommendations": params.get(
                    "maintenance_recommendations"
                ),
            },
            fetch="one",
        )

    async def get(
        self, provider_id: str, booking_id: str
    ) -> dict[str, Any] | None:
        return await self._sql.execute(
            ProviderJobCompletionQueryIds.GET,
            {"user_id": provider_id, "booking_id": booking_id},
            fetch="one",
        )
