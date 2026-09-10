"""ProviderChangeRequestSqlAdapter — implemented via governed queries (Phase 23).

The only code that knows PROV.CHANGE.* query ids. Supporting photos are
serialised here as a JSON array of media URLs (typically Phase 22
evidence media_urls).
"""
from __future__ import annotations

import json
from typing import Any


class ProviderChangeRequestQueryIds:
    SUBMIT = "PROV.CHANGE.SUBMIT"
    LIST = "PROV.CHANGE.LIST"
    GET = "PROV.CHANGE.GET"
    WITHDRAW = "PROV.CHANGE.WITHDRAW"


class ProviderChangeRequestSqlAdapter:
    def __init__(self, sql_query_manager: Any) -> None:
        self._sql = sql_query_manager

    async def submit(
        self,
        provider_id: str,
        booking_id: str,
        params: dict[str, Any],
    ) -> dict[str, Any] | None:
        return await self._sql.execute(
            ProviderChangeRequestQueryIds.SUBMIT,
            {
                "user_id": provider_id,
                "booking_id": booking_id,
                "change_type": params.get("change_type"),
                "current_value": params.get("current_value"),
                "proposed_value": params.get("proposed_value"),
                "reason": params.get("reason"),
                "new_work": params.get("new_work"),
                "additional_labour": params.get("additional_labour"),
                "additional_materials": params.get("additional_materials"),
                "additional_time_minutes": params.get("additional_time_minutes"),
                "additional_price": params.get("additional_price"),
                "currency": params.get("currency"),
                "supporting_photos": json.dumps(params.get("supporting_photos") or []),
            },
            fetch="one",
        )

    async def list_for_booking(
        self, provider_id: str, booking_id: str
    ) -> list[dict[str, Any]]:
        rows = await self._sql.execute(
            ProviderChangeRequestQueryIds.LIST,
            {"user_id": provider_id, "booking_id": booking_id},
            fetch="all",
        )
        return list(rows or [])

    async def get_owned(
        self, provider_id: str, change_id: str
    ) -> dict[str, Any] | None:
        return await self._sql.execute(
            ProviderChangeRequestQueryIds.GET,
            {"user_id": provider_id, "change_id": change_id},
            fetch="one",
        )

    async def withdraw(
        self, provider_id: str, change_id: str
    ) -> dict[str, Any] | None:
        return await self._sql.execute(
            ProviderChangeRequestQueryIds.WITHDRAW,
            {"user_id": provider_id, "change_id": change_id},
            fetch="one",
        )
