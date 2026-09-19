"""Provider settings services - preferences, security, privacy (Phase 50).

Mirrors app/domains/accounts/services/account_service.py's
PreferenceService/SecurityService/PrivacyService for providers.
Personal/business info editing already exists as provider_profile_service
and provider_business_service and is untouched by this phase.
"""
from __future__ import annotations

from typing import Any

from app.ports.persistence.provider_account_repository import ProviderAccountRepository
from app.ports.persistence.provider_settings_repository import (
    ProviderPreferenceRepositoryPort,
    ProviderPrivacyRepositoryPort,
)
from app.shared.exceptions.hierarchy import AuthenticationError, ValidationError


class ProviderPreferenceService:
    def __init__(self, repo: ProviderPreferenceRepositoryPort) -> None:
        self._repo = repo

    async def list(self, provider_id: str) -> list[dict[str, Any]]:
        return await self._repo.list(provider_id)

    async def set(self, provider_id: str, key: str, value: str) -> dict[str, Any]:
        if not key or len(key) > 80:
            raise ValidationError("Preference key must be 1-80 characters")
        result = await self._repo.set(provider_id, key, value)
        if result is None:
            raise RuntimeError("Failed to set preference")
        return result


class ProviderSecurityService:
    def __init__(
        self, accounts: ProviderAccountRepository, hasher: Any, activity_log: Any = None
    ) -> None:
        self._accounts = accounts
        self._hasher = hasher
        self._activity_log = activity_log

    async def change_password(self, provider_id: str, current_password: str, new_password: str) -> bool:
        if len(new_password) < 8:
            raise ValidationError("Password must be at least 8 characters")
        provider = await self._accounts.get_by_id_with_hash(provider_id)
        if not provider or not self._hasher.verify(current_password, provider["password_hash"]):
            raise AuthenticationError("Current password is incorrect")
        result = await self._accounts.update_password(provider_id, self._hasher.hash(new_password))
        if not result:
            raise RuntimeError("Password update failed")
        if self._activity_log is not None:
            await self._activity_log.record(provider_id, action="SECURITY.PASSWORD_CHANGED")
        return True

    async def revoke_all_sessions(self, provider_id: str) -> dict[str, Any]:
        # No active sessions to revoke is a successful no-op, not a failure —
        # session_revoke_all's UPDATE ... RETURNING is empty either way.
        await self._accounts.session_revoke_all(provider_id)
        if self._activity_log is not None:
            await self._activity_log.record(provider_id, action="SECURITY.SESSIONS_REVOKED")
        return {"revoked": True}


class ProviderPrivacyService:
    _VALID_KINDS = {"MARKETING", "ANALYTICS", "COMMUNICATION"}

    def __init__(self, repo: ProviderPrivacyRepositoryPort) -> None:
        self._repo = repo

    async def list_consents(self, provider_id: str) -> list[dict[str, Any]]:
        return await self._repo.list_consents(provider_id)

    async def set_consent(self, provider_id: str, kind: str, consented: bool) -> dict[str, Any]:
        kind = (kind or "").upper()
        if kind not in self._VALID_KINDS:
            raise ValidationError(f"Unknown consent kind '{kind}'")
        result = await self._repo.set_consent(provider_id, kind, consented)
        if result is None:
            raise RuntimeError("Failed to update consent")
        return result

    async def request_export(self, provider_id: str) -> dict[str, Any]:
        result = await self._repo.request_export(provider_id)
        if result is None:
            raise RuntimeError("Failed to request data export")
        return result

    async def list_exports(
        self, provider_id: str, limit: int = 20, offset: int = 0
    ) -> list[dict[str, Any]]:
        return await self._repo.list_exports(provider_id, limit=limit, offset=offset)
