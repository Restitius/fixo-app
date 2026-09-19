"""ProviderTeamService - business rules for provider team management."""
from __future__ import annotations

from typing import Any

from app.ports.persistence.provider_team_repository import ProviderTeamRepositoryPort
from app.shared.exceptions.hierarchy import ConflictError, NotFoundError, ValidationError

_ROLES = {"OWNER", "MANAGER", "TECHNICIAN", "DISPATCHER", "OTHER"}


class ProviderTeamService:
    def __init__(self, repository: ProviderTeamRepositoryPort) -> None:
        self._repo = repository

    async def create_member(
        self,
        provider_id: str,
        *,
        full_name: str,
        phone: str,
        email: str | None,
        role: str,
        notes: str | None,
    ) -> dict[str, Any]:
        full_name = (full_name or "").strip()
        phone = (phone or "").strip()
        role = (role or "TECHNICIAN").upper()
        if not 2 <= len(full_name) <= 120:
            raise ValidationError("full_name must be 2-120 characters")
        if not phone:
            raise ValidationError("phone is required")
        if role not in _ROLES:
            raise ValidationError(f"Unknown role '{role}'")
        member = await self._repo.create_member(
            provider_id, full_name=full_name, phone=phone, email=email, role=role, notes=notes
        )
        if member is None:
            raise RuntimeError("Failed to add team member")
        return member

    async def list_members(
        self,
        provider_id: str,
        *,
        status: str | None = None,
        role: str | None = None,
        limit: int = 20,
        offset: int = 0,
    ) -> list[dict[str, Any]]:
        return await self._repo.list_members(
            provider_id, status=status, role=role, limit=limit, offset=offset
        )

    async def get_member(self, provider_id: str, *, member_id: str) -> dict[str, Any]:
        member = await self._repo.get_member(provider_id, member_id=member_id)
        if member is None:
            raise NotFoundError("Team member not found")
        return member

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
    ) -> dict[str, Any]:
        if role is not None and role.upper() not in _ROLES:
            raise ValidationError(f"Unknown role '{role}'")
        member = await self._repo.update_member(
            provider_id,
            member_id=member_id,
            full_name=full_name,
            phone=phone,
            email=email,
            role=(role.upper() if role else None),
            notes=notes,
        )
        if member is None:
            raise NotFoundError("Team member not found")
        return member

    async def deactivate_member(self, provider_id: str, *, member_id: str) -> dict[str, Any]:
        await self.get_member(provider_id, member_id=member_id)
        result = await self._repo.deactivate_member(provider_id, member_id=member_id)
        if result is None:
            raise ConflictError("Team member is already inactive")
        return result
