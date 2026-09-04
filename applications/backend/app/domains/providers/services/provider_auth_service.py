"""ProviderAuthService — provider registration, OTP verification, login, sessions.

Mirrors the customer AuthService but for the PROVIDER principal (Requirement
Phase 1). Depends ONLY on ports + security helpers — no SQL, no query IDs.
"""
from __future__ import annotations

import hashlib
import logging
import secrets
from typing import Any

from app.security.jwt import JwtService
from app.security.password import PasswordHasher
from app.shared.exceptions.hierarchy import (
    AuthenticationError,
    ConflictError,
    NotFoundError,
    ValidationError,
)

logger = logging.getLogger(__name__)

DEV_MODE = True  # surfaces OTP codes in responses until SMS/email adapters land


def _hash_code(code: str) -> str:
    return hashlib.sha256(code.encode()).hexdigest()


def _display_name(first: str, middle: str, last: str) -> str:
    return " ".join(p for p in (first, middle, last) if p).strip()


class ProviderAuthService:
    """Provider registration + authentication (Requirement Phase 1)."""

    def __init__(
        self,
        providers: Any,  # ProviderAccountRepository port
        hasher: PasswordHasher,
        jwt_service: JwtService,
        events: Any = None,
    ) -> None:
        self._providers = providers
        self._hasher = hasher
        self._jwt = jwt_service
        self._events = events

    # -- registration + verification -----------------------------------------

    async def register(self, data: dict[str, Any]) -> dict[str, Any]:
        email = data.get("email", "").strip().lower()
        if not email or not data.get("password"):
            raise ValidationError("email and password are required")
        if len(data["password"]) < 8:
            raise ValidationError("Password must be at least 8 characters")

        existing = await self._providers.get_by_email(email)
        if existing:
            raise ConflictError("A provider account with this email already exists")

        first = data.get("first_name", "").strip()
        last = data.get("last_name", "").strip()
        if not first or not last:
            raise ValidationError("first_name and last_name are required")

        account_type = data.get("account_type", "INDIVIDUAL").upper()
        if account_type not in ("INDIVIDUAL", "BUSINESS"):
            raise ValidationError("account_type must be INDIVIDUAL or BUSINESS")

        created = await self._providers.create(
            {
                "display_name": data.get("display_name")
                or _display_name(first, data.get("middle_name", "").strip(), last),
                "first_name": first,
                "middle_name": data.get("middle_name", "").strip(),
                "last_name": last,
                "email": email,
                "phone": data.get("phone", "").strip(),
                "password_hash": self._hasher.hash(data["password"]),
                "account_type": account_type,
                "country": data.get("country", "").strip() or None,
                "region": data.get("region", "").strip() or None,
                "city": data.get("city", "").strip() or None,
                "district": data.get("district", "").strip() or None,
                "preferred_language": data.get("preferred_language", "en"),
                "referral_code": data.get("referral_code", "").strip() or None,
                "terms_accepted": bool(data.get("terms_accepted")),
                "privacy_accepted": bool(data.get("privacy_accepted")),
            }
        )
        if not created:
            raise ValidationError("Provider registration failed")

        code = await self._issue_otp(created["provider_id"], "VERIFY_EMAIL")
        await self._publish("EVT.PROVIDER.REGISTERED", created)
        return {**created, **( {"otp_code": code} if DEV_MODE else {})}

    async def request_otp(self, email: str) -> dict[str, Any]:
        provider = await self._providers.get_by_email(email.strip().lower())
        if not provider:
            return {"sent": True}  # do not reveal account existence
        code = await self._issue_otp(str(provider["provider_id"]), "VERIFY_EMAIL")
        return {"sent": True, **( {"otp_code": code} if DEV_MODE else {})}

    async def request_password_reset(self, email: str) -> dict[str, Any]:
        provider = await self._providers.get_by_email(email.strip().lower())
        if not provider:
            return {"sent": True}
        code = await self._issue_otp(str(provider["provider_id"]), "PASSWORD_RESET")
        return {"sent": True, **( {"otp_code": code} if DEV_MODE else {})}

    async def reset_password(self, email: str, code: str, new_password: str) -> dict[str, Any]:
        if len(new_password) < 8:
            raise ValidationError("Password must be at least 8 characters")
        provider = await self._require_provider(email)
        ok = await self._providers.verify_otp(
            str(provider["provider_id"]), "PASSWORD_RESET", _hash_code(code)
        )
        if not ok:
            raise AuthenticationError("Invalid or expired reset code")

        updated = await self._providers.update_password(
            str(provider["provider_id"]), self._hasher.hash(new_password)
        )
        if not updated:
            raise ValidationError("Could not reset the password")
        await self._providers.session_revoke_all(str(provider["provider_id"]))
        await self._publish("EVT.PROVIDER.PASSWORD_RESET", updated or provider)
        return {"reset": True}

    async def verify_otp(self, email: str, code: str) -> dict[str, Any]:
        provider = await self._require_provider(email)
        ok = await self._providers.verify_otp(
            str(provider["provider_id"]), "VERIFY_EMAIL", _hash_code(code)
        )
        if not ok:
            raise AuthenticationError("Invalid or expired verification code")

        updated = await self._providers.mark_verified(
            str(provider["provider_id"]), email=True, phone=False
        )
        await self._publish("EVT.PROVIDER.VERIFIED", updated or provider)
        return {"verified": True, "provider_id": str(provider["provider_id"])}

    # -- login / tokens --------------------------------------------------------

    async def login(self, email: str, password: str, device_info: str = "", ip: str = "") -> dict[str, Any]:
        provider = await self._providers.get_by_email(email.strip().lower())
        if not provider or not self._hasher.verify(password, provider["password_hash"]):
            raise AuthenticationError("Invalid email or password")
        if provider["status"] not in ("ACTIVE", "DRAFT"):
            raise AuthenticationError(
                f"Account status '{provider['status']}' does not permit login"
            )
        return await self._issue_tokens(provider, device_info, ip)

    async def refresh(self, refresh_token: str) -> dict[str, Any]:
        token_hash = _hash_code(refresh_token)
        session = await self._providers.session_get_valid(token_hash)
        if not session:
            raise AuthenticationError("Session expired or revoked")

        provider = await self._providers.get_by_id(str(session["provider_id"]))
        if not provider:
            raise AuthenticationError("Account no longer exists")

        await self._providers.session_revoke(token_hash)
        return await self._issue_tokens(provider, device_info="", ip="")

    async def me(self, user_id: str) -> dict[str, Any]:
        provider = await self._providers.get_by_id(user_id)
        if not provider:
            raise NotFoundError("Provider not found")
        return provider

    async def logout(self, user_id: str) -> None:
        await self._providers.session_revoke_all(user_id)
        await self._publish("EVT.PROVIDER.LOGOUT", {"provider_id": user_id})

    # -- internals --------------------------------------------------------------

    async def _issue_otp(self, provider_id: str, purpose: str) -> str:
        code = str(secrets.randbelow(10 ** 6)).zfill(6)
        await self._providers.issue_otp(
            str(provider_id), "EMAIL", purpose, _hash_code(code), ttl_minutes=10
        )
        return code

    async def _require_provider(self, email: str) -> dict[str, Any]:
        provider = await self._providers.get_by_email(email.strip().lower())
        if not provider:
            raise NotFoundError("Provider account not found")
        return provider

    async def _issue_tokens(self, provider: dict[str, Any], device_info: str, ip: str) -> dict[str, Any]:
        sub = str(provider["provider_id"])
        access = self._jwt.encode_access({"sub": sub, "principal": "PROVIDER"})
        refresh = self._jwt.encode_refresh({"sub": sub, "principal": "PROVIDER"})
        await self._providers.session_create(
            sub, _hash_code(refresh), device_info, ip, self._jwt.refresh_ttl_seconds
        )
        await self._publish("EVT.PROVIDER.LOGIN", {"provider_id": sub})
        return {
            "access_token": access,
            "refresh_token": refresh,
            "token_type": "bearer",
            "provider": provider,
        }

    async def _publish(self, name: str, payload: dict[str, Any]) -> None:
        if self._events is None:
            return
        from app.events.event import make_event

        await self._events.publish(make_event(name, payload))