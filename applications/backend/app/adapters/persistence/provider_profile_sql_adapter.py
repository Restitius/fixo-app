"""ProviderProfileSqlAdapter — implements ProviderProfileRepository via governed queries.

This is the ONLY place PRV.PROFILE.* query IDs appear.
"""
from __future__ import annotations

from typing import Any

from app.platform.query.sql_query_manager import SQLQueryManager


class ProviderProfileQueryIds:
    GET = "PRV.PROFILE.GET"
    UPDATE = "PRV.PROFILE.UPDATE"
    PUBLIC = "PRV.PROFILE.PUBLIC"


class ProviderProfileSqlAdapter:
    """Implements ProviderProfileRepository.

    update() always binds the FULL parameter set (absent fields as NULL) so
    the governed SQL's COALESCE(...) keeps current values for fields the
    caller did not supply — SQLAlchemy text() requires every named param.
    """

    _PROFILE_PARAMS = (
        "profile_photo_url",
        "gender",
        "date_of_birth",
        "bio",
        "languages",
        "years_experience",
        "professional_title",
        "qualifications",
        "certifications",
        "skills",
        "specializations",
        "tools",
    )

    def __init__(self, sql_manager: SQLQueryManager) -> None:
        self._sql = sql_manager

    async def get(self, provider_id: str) -> Any | None:
        return await self._sql.execute(
            ProviderProfileQueryIds.GET, {"user_id": provider_id}, fetch="one"
        )

    async def update(self, provider_id: str, fields: dict[str, Any]) -> Any | None:
        params: dict[str, Any] = {name: None for name in self._PROFILE_PARAMS}
        params["user_id"] = provider_id
        for name, value in fields.items():
            if name in params:
                params[name] = value
        return await self._sql.execute(
            ProviderProfileQueryIds.UPDATE, params, fetch="one"
        )

    async def public_view(self, provider_id: str) -> Any | None:
        return await self._sql.execute(
            ProviderProfileQueryIds.PUBLIC, {"user_id": provider_id}, fetch="one"
        )
