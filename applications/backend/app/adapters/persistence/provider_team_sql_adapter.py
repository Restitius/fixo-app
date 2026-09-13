"""ProviderTeamSqlAdapter - the only layer that knows the PROV.TEAM.* IDs."""
from __future__ import annotations

from typing import Any

from sqlalchemy.exc import IntegrityError

from app.ports.persistence.provider_team_repository import ProviderTeamRepositoryPort
from app.shared.exceptions.hierarchy import ConflictError

_LIMIT_CAP = 100


class ProviderTeamSqlAdapter(ProviderTeamRepositoryPort):
    def __init__(self, queries: Any) -> None:
        self._queries = queries

    async def create_member(
        self,
        provider_id: str,
        *,
        full_name: str,
        phone: str,
        email: str | None,
        role: str,
        notes: str | None,
    ) -> dict[str, Any] | None:
        try:
            rows = await self._queries.execute(
                "PROV.TEAM.MEMBER.CREATE",
                {
                    "provider_id": provider_id,
                    "full_name": full_name,
                    "phone": phone,
                    "email": email,
                    "role": role,
                    "notes": notes,
                },
            )
        except IntegrityError as exc:
            raise ConflictError(
                "A team member with this phone number already exists"
            ) from exc
        return rows[0] if rows else None

    async def list_members(
        self,
        provider_id: str,
        *,
        status: str | None = None,
        role: str | None = None,
        limit: int = 20,
        offset: int = 0,
    ) -> list[dict[str, Any]]:
        return await self._queries.execute(
            "PROV.TEAM.MEMBERS.LIST",
            {
                "user_id": provider_id,
                "status": status,
                "role": role,
                "limit": max(1, min(limit, _LIMIT_CAP)),
                "offset": max(offset, 0),
            },
        )

    async def get_member(self, provider_id: str, *, member_id: str) -> dict[str, Any] | None:
        rows = await self._queries.execute(
            "PROV.TEAM.MEMBER.GET",
            {"user_id": provider_id, "member_id": member_id},
        )
        return rows[0] if rows else None

    async def update_member(
        self,
        provider_id: str,
        *,
        member_id: str,
        full_name: str | None = None,
        phone: str | None = None,
        email: str | None = None,
        role: str | None = None,
        notes: str | None = None,
    ) -> dict[str, Any] | None:
        try:
            rows = await self._queries.execute(
                "PROV.TEAM.MEMBER.UPDATE",
                {
                    "user_id": provider_id,
                    "member_id": member_id,
                    "full_name": full_name,
                    "phone": phone,
                    "email": email,
                    "role": role,
                    "notes": notes,
                },
            )
        except IntegrityError as exc:
            raise ConflictError(
                "A team member with this phone number already exists"
            ) from exc
        return rows[0] if rows else None

    async def deactivate_member(self, provider_id: str, *, member_id: str) -> dict[str, Any] | None:
        rows = await self._queries.execute(
            "PROV.TEAM.MEMBER.DEACTIVATE",
            {"user_id": provider_id, "member_id": member_id},
        )
        return rows[0] if rows else None
