"""Provider service configuration SQL adapter — governed queries only (Phase 6).

Every bind parameter named in the SQL is always supplied (SQLAlchemy text()
requires the full set); JSONB fields are serialised to JSON strings here.
"""
from __future__ import annotations

import json
from typing import Any


class ProviderServiceConfigQueryIds:
    CATALOG = "PRV.SERVICE.CATALOG"
    LIST = "PRV.SERVICE.LIST"
    GET = "PRV.SERVICE.GET"
    UPSERT = "PRV.SERVICE.UPSERT"
    DELETE = "PRV.SERVICE.DELETE"
    SUBMIT = "PRV.SERVICE.SUBMIT"
    REVIEW = "PRV.SERVICE.REVIEW"


_JSON_FIELDS = ("tools", "materials", "warranty", "photos")


class ProviderServiceConfigSqlAdapter:
    """The only code that knows the PRV.SERVICE.* query ids."""

    def __init__(self, sql_query_manager: Any) -> None:
        self._sql = sql_query_manager

    async def catalog(self) -> list[dict[str, Any]]:
        return await self._sql.execute(ProviderServiceConfigQueryIds.CATALOG, {}) or []

    async def list_configs(self, provider_id: str) -> list[dict[str, Any]]:
        return (
            await self._sql.execute(
                ProviderServiceConfigQueryIds.LIST, {"user_id": provider_id}
            )
            or []
        )

    async def get_config(self, provider_id: str, service_id: str) -> Any | None:
        return await self._sql.execute(
            ProviderServiceConfigQueryIds.GET,
            {"user_id": provider_id, "service_id": service_id},
            fetch="one",
        )

    async def upsert_config(
        self, provider_id: str, service_id: str, data: dict[str, Any]
    ) -> Any | None:
        return await self._sql.execute(
            ProviderServiceConfigQueryIds.UPSERT,
            self._bind(data, provider_id=provider_id, service_id=service_id),
            fetch="one",
        )

    async def archive_config(self, provider_id: str, service_id: str) -> Any | None:
        return await self._sql.execute(
            ProviderServiceConfigQueryIds.DELETE,
            {"user_id": provider_id, "service_id": service_id},
            fetch="one",
        )

    async def submit_for_approval(
        self, provider_id: str, service_id: str
    ) -> Any | None:
        return await self._sql.execute(
            ProviderServiceConfigQueryIds.SUBMIT,
            {"user_id": provider_id, "service_id": service_id},
            fetch="one",
        )

    async def review_config(
        self,
        provider_id: str,
        service_id: str,
        reviewer_id: str,
        decision: str,
        review_notes: str | None,
    ) -> Any | None:
        return await self._sql.execute(
            ProviderServiceConfigQueryIds.REVIEW,
            {
                "provider_id": provider_id,
                "service_id": service_id,
                "reviewer_id": reviewer_id,
                "decision": decision,
                "review_notes": review_notes,
            },
            fetch="one",
        )

    # -- helpers ---------------------------------------------------------------

    def _bind(
        self, data: dict[str, Any], *, provider_id: str, service_id: str
    ) -> dict[str, Any]:
        params: dict[str, Any] = {
            "user_id": provider_id,
            "service_id": service_id,
            "display_name": data.get("display_name"),
            "description": data.get("description"),
            "years_experience": data.get("years_experience"),
            "pricing_model": data.get("pricing_model"),
            "minimum_charge": data.get("minimum_charge"),
            "duration_minutes": data.get("duration_minutes"),
            "is_emergency_available": bool(data.get("is_emergency_available", False)),
        }
        for field in _JSON_FIELDS:
            value = data.get(field)
            params[field] = json.dumps(value) if value is not None else None
        return params
