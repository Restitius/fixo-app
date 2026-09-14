"""ProviderAccountRestrictionsService - provider account restrictions & status (Phase 53).

impose()/lift() are platform/admin actions (mirroring Disputes' "resolution
stays platform-side" convention) — not exposed via any provider-facing
router in this phase, kept here for the admin module to call later.
list_active()/history()/status_summary() are the provider-facing read path.
"""
from __future__ import annotations

from datetime import datetime
from typing import Any

from app.ports.persistence.provider_account_restrictions_repository import (
    ProviderAccountRestrictionsRepositoryPort,
)
from app.shared.exceptions.hierarchy import ConflictError, ValidationError

_RESTRICTION_TYPES = {"WARNING", "SUSPENSION", "FEATURE_LIMIT", "BAN"}


class ProviderAccountRestrictionsService:
    def __init__(self, repository: ProviderAccountRestrictionsRepositoryPort) -> None:
        self._repo = repository

    async def impose(
        self,
        provider_id: str,
        *,
        restriction_type: str,
        reason: str,
        expires_at: datetime | None = None,
    ) -> dict[str, Any]:
        restriction_type = (restriction_type or "").upper()
        reason = (reason or "").strip()
        if restriction_type not in _RESTRICTION_TYPES:
            raise ValidationError(f"Unknown restriction_type '{restriction_type}'")
        if not reason:
            raise ValidationError("reason is required")
        record = await self._repo.impose(
            provider_id, restriction_type=restriction_type, reason=reason, expires_at=expires_at
        )
        if record is None:
            raise RuntimeError("Failed to impose restriction")
        return record

    async def lift(self, restriction_id: str, *, lifted_reason: str | None = None) -> dict[str, Any]:
        result = await self._repo.lift(restriction_id, lifted_reason=lifted_reason)
        if result is None:
            raise ConflictError("Restriction not found or already lifted")
        return result

    async def list_active(self, provider_id: str) -> list[dict[str, Any]]:
        return await self._repo.list_active(provider_id)

    async def history(
        self, provider_id: str, *, limit: int = 20, offset: int = 0
    ) -> list[dict[str, Any]]:
        return await self._repo.history(provider_id, limit=limit, offset=offset)

    async def status_summary(self, provider_id: str) -> dict[str, Any]:
        active = await self.list_active(provider_id)
        return {"is_restricted": len(active) > 0, "active_restrictions": active}
