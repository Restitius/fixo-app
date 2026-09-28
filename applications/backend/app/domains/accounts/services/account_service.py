"""Account domain services — business rules, ports-only, no query IDs."""
from __future__ import annotations

from typing import Any

from app.ports.persistence.account_ports import (
    AccountClosureRepositoryPort,
    PaymentMethodRepositoryPort,
    PreferenceRepositoryPort,
    PrivacyRepositoryPort,
    SecurityRepositoryPort,
)


class PaymentMethodService:
    """Module 45 — payment-method CRUD + set-default (single default per customer)."""

    def __init__(self, repo: PaymentMethodRepositoryPort) -> None:
        self._repo = repo

    async def list(self, customer_id: str, limit: int = 20, offset: int = 0) -> list[dict[str, Any]]:
        return await self._repo.list(customer_id, limit=limit, offset=offset)

    async def add(self, customer_id: str, type: str, provider: str, details_masked: dict[str, Any]) -> dict[str, Any]:
        if type not in ("card", "mpesa", "bank"):
            raise ValueError(f"Unsupported payment type '{type}'")
        result = await self._repo.add(customer_id, type, provider, details_masked)
        if result is None:
            raise RuntimeError("Failed to add payment method")
        return result

    async def set_default(self, customer_id: str, method_id: str) -> dict[str, Any]:
        result = await self._repo.set_default(customer_id, method_id)
        if result is None:
            raise ValueError("Payment method not found or not owned")
        return result

    async def remove(self, customer_id: str, method_id: str) -> bool:
        ok = await self._repo.remove(customer_id, method_id)
        if not ok:
            raise ValueError("Cannot remove this payment method (may be default, or last one, or not owned)")
        return ok


class PreferenceService:
    """Module 47 — key/value preferences."""

    def __init__(self, repo: PreferenceRepositoryPort) -> None:
        self._repo = repo

    async def list(self, customer_id: str) -> list[dict[str, Any]]:
        return await self._repo.list(customer_id)

    async def set(self, customer_id: str, key: str, value: str) -> dict[str, Any]:
        if not key or len(key) > 80:
            raise ValueError("Preference key must be 1-80 characters")
        result = await self._repo.set(customer_id, key, value)
        if result is None:
            raise RuntimeError("Failed to set preference")
        return result


class SecurityService:
    """Module 46 — password change + session revocation."""

    def __init__(
        self,
        repo: SecurityRepositoryPort,
        hasher: Any | None = None,
        sessions_repo: Any | None = None,
        customers: Any | None = None,
    ) -> None:
        self._repo = repo
        self._hasher = hasher
        self._sessions = sessions_repo
        self._customers = customers

    async def change_password(self, customer_id: str, current_password: str, new_password: str) -> bool:
        if len(new_password) < 8:
            raise ValueError("Password must be at least 8 characters")
        # Previously this verified nothing and wrote new_password straight into
        # password_hash unhashed — anyone holding a valid session could rewrite
        # the account's password to whatever they liked, in plaintext. Fixed to
        # actually verify the current password and hash the new one.
        customer = await self._customers.get_by_id_with_hash(customer_id)
        if not customer or not self._hasher.verify(current_password, customer["password_hash"]):
            raise ValueError("Current password is incorrect")
        result = await self._repo.change_password(customer_id, self._hasher.hash(new_password))
        if not result:
            raise ValueError("Password update failed")
        return True

    async def revoke_all_sessions(self, customer_id: str, reason: str) -> dict[str, Any]:
        if not reason:
            reason = "security"
        result = await self._repo.revoke_sessions(customer_id, reason)
        if result is None:
            raise RuntimeError("Failed to revoke sessions")
        return result

    async def list_sessions(self, customer_id: str) -> list[dict[str, Any]]:
        if self._sessions is None:
            return []
        return await self._sessions.list_for_customer(customer_id)


class PrivacyService:
    """Module 49 — consent management + data export."""

    def __init__(self, repo: PrivacyRepositoryPort) -> None:
        self._repo = repo

    async def list_consents(self, customer_id: str) -> list[dict[str, Any]]:
        return await self._repo.list_consents(customer_id)

    async def set_consent(self, customer_id: str, kind: str, consented: bool) -> dict[str, Any]:
        valid_kinds = {"MARKETING", "ANALYTICS", "COMMUNICATION"}
        if kind not in valid_kinds:
            raise ValueError(f"Unknown consent kind '{kind}'")
        result = await self._repo.set_consent(customer_id, kind, consented)
        if result is None:
            raise RuntimeError("Failed to update consent")
        return result

    async def request_export(self, customer_id: str) -> dict[str, Any]:
        result = await self._repo.request_export(customer_id)
        if result is None:
            raise RuntimeError("Failed to request data export")
        return result

    async def list_exports(self, customer_id: str, limit: int = 20, offset: int = 0) -> list[dict[str, Any]]:
        return await self._repo.list_exports(customer_id, limit=limit, offset=offset)


class AccountClosureService:
    """Module 50 — account closure with a consequences preview and identity check."""

    RETAINED_NOTE = (
        "Bookings, invoices and payment records are kept for legal and financial "
        "reasons; your profile, addresses, saved payment methods and preferences "
        "are no longer used."
    )

    def __init__(self, repo: AccountClosureRepositoryPort, customers: Any = None, hasher: Any = None) -> None:
        self._repo = repo
        self._customers = customers
        self._hasher = hasher

    async def preview(self, customer_id: str) -> dict[str, Any]:
        info = await self._repo.closure_preview(customer_id)
        blockers = []
        if info.get("active_bookings"):
            blockers.append("You have bookings in progress. Complete or cancel them first.")
        if info.get("open_disputes"):
            blockers.append("You have open disputes. Wait for them to be resolved or withdraw them.")
        return {**info, "blockers": blockers, "can_close": not blockers, "retained_data": self.RETAINED_NOTE}

    async def schedule_closure(self, customer_id: str, password: str | None = None) -> dict[str, Any]:
        from app.shared.exceptions.hierarchy import ConflictError, ValidationError

        if self._customers is not None and self._hasher is not None:
            customer = await self._customers.get_by_id_with_hash(customer_id)
            if not password or not customer or not self._hasher.verify(password, customer["password_hash"]):
                raise ValidationError("Enter your current password to confirm account closure")
        preview = await self.preview(customer_id)
        if not preview["can_close"]:
            raise ConflictError(" ".join(preview["blockers"]))
        result = await self._repo.schedule_closure(customer_id)
        if not result or not result.get("closed"):
            raise ConflictError("This account cannot be closed right now")
        return {**result, "retained_data": self.RETAINED_NOTE}
