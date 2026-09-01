"""AuthService — customer registration, login, OTP verification, sessions.

Depends ONLY on ports (CustomerRepository, OtpRepository, SessionRepository,
EventPublisher) plus pure security helpers. No SQL, no query IDs.
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
    # Deterministic hash so the DB function can compare without plaintext.
    return hashlib.sha256(code.encode()).hexdigest()


class AuthService:
    def __init__(
        self,
        customers: Any,
        otps: Any,
        sessions: Any,
        hasher: PasswordHasher,
        jwt_service: JwtService,
        events: Any,
    ) -> None:
        self._customers = customers
        self._otps = otps
        self._sessions = sessions
        self._hasher = hasher
        self._jwt = jwt_service
        self._events = events

    # -- registration + verification -----------------------------------------

    async def register(self, data: dict[str, Any]) -> dict[str, Any]:
        if await self._customers.get_by_email(data["email"]):
            raise ConflictError("An account with this email already exists")

        row = await self._customers.create(
            {
                "full_name": data["full_name"].strip(),
                "phone": data["phone"].strip(),
                "email": data["email"].strip().lower(),
                "password_hash": self._hasher.hash(data["password"]),
                "preferred_language": data.get("preferred_language", "en"),
                "terms_accepted": bool(data.get("terms_accepted")),
                "privacy_accepted": bool(data.get("privacy_accepted")),
            }
        )
        if not row:
            raise ValidationError("Registration failed")

        code = await self._issue_otp(row["customer_id"], "VERIFY_EMAIL")
        await self._publish("EVT.CUSTOMER.REGISTERED", row)
        return {**row, **({"otp_code": code} if DEV_MODE else {})}

    async def request_otp(self, email: str) -> dict[str, Any]:
        customer = await self._customers.get_by_email(email.strip().lower())
        if not customer:
            # Do not reveal account existence.
            return {"sent": True}
        code = await self._issue_otp(customer["customer_id"], "VERIFY_EMAIL")
        return {"sent": True, **({"otp_code": code} if DEV_MODE else {})}

    async def verify_otp(self, email: str, code: str) -> dict[str, Any]:
        customer = await self._require_customer(email)
        ok = await self._otps.verify(
            customer["customer_id"],
            {"purpose": "VERIFY_EMAIL", "code_hash": _hash_code(code)},
        )
        if not ok:
            raise AuthenticationError("Invalid or expired verification code")

        updated = await self._customers.mark_verified(
            customer["customer_id"], email=True, phone=False
        )
        await self._publish("EVT.CUSTOMER.VERIFIED", updated or customer)
        return {"verified": True, "customer_id": customer["customer_id"]}

    # -- login / tokens --------------------------------------------------------

    async def login(self, email: str, password: str, device_info: str = "", ip: str = "") -> dict[str, Any]:
        customer = await self._customers.get_by_email(email.strip().lower())
        if not customer or not self._hasher.verify(password, customer["password_hash"]):
            raise AuthenticationError("Invalid email or password")
        if customer["status"] != "ACTIVE":
            raise AuthenticationError(
                f"Account status '{customer['status']}' does not permit login"
            )
        return await self._issue_tokens(customer, device_info, ip)

    async def refresh(self, refresh_token: str) -> dict[str, Any]:
        token_hash = _hash_code(refresh_token)
        session = await self._sessions.get_valid(token_hash)
        if not session:
            raise AuthenticationError("Session expired or revoked")

        customer = await self._customers.get_by_id(str(session["customer_id"]))
        if not customer:
            raise AuthenticationError("Account no longer exists")

        # Rotate: revoke old row, mint a fresh pair.
        await self._sessions.revoke(token_hash)
        return await self._issue_tokens(customer, device_info="", ip="")

    async def me(self, user_id: str) -> dict[str, Any]:
        customer = await self._customers.get_by_id(user_id)
        if not customer:
            raise NotFoundError("Customer not found")
        return customer

    async def logout(self, user_id: str) -> dict[str, Any]:
        # Revoke all active sessions for the customer.
        await self._sessions.revoke_all(user_id)
        return {"success": True}

    # -- internals --------------------------------------------------------------

    async def _require_customer(self, email: str) -> dict[str, Any]:
        customer = await self._customers.get_by_email(email.strip().lower())
        if not customer:
            raise NotFoundError("No account found for this email")
        return customer

    async def _issue_otp(self, customer_id: str, purpose: str) -> str:
        code = f"{secrets.randbelow(1_000_000):06d}"
        await self._otps.issue(
            customer_id,
            {
                "channel": "EMAIL",
                "purpose": purpose,
                "code_hash": _hash_code(code),
                "ttl_minutes": 10,
            },
        )
        logger.info("OTP issued for %s (%s)", customer_id, purpose)
        return code

    async def _issue_tokens(self, customer: dict[str, Any], device_info: str, ip: str) -> dict[str, Any]:
        claims = {"sub": str(customer["customer_id"]), "role": "customer"}
        access = self._jwt.encode_access(claims)
        refresh = self._jwt.encode_refresh(claims)
        await self._sessions.create(
            {
                "user_id": str(customer["customer_id"]),
                "refresh_token_hash": _hash_code(refresh),
                "device_info": device_info[:255],
                "ip_address": ip[:45],
                "ttl_seconds": self._jwt.refresh_ttl_seconds,
            }
        )
        return {
            "access_token": access,
            "refresh_token": refresh,
            "token_type": "Bearer",
            "expires_in": self._jwt.access_ttl_seconds,
            "customer": {
                "customer_id": str(customer["customer_id"]),
                "full_name": customer["full_name"],
                "email": customer["email"],
                "email_verified": customer["email_verified"],
                "phone": customer.get("phone"),
                "phone_verified": customer.get("phone_verified", False),
                "preferred_language": customer.get("preferred_language"),
                "created_at": str(customer["created_at"]) if customer.get("created_at") else None,
            },
        }

    async def _publish(self, name: str, payload: dict[str, Any]) -> None:
        if self._events is None:
            return
        from app.events.event import make_event

        await self._events.publish(make_event(name, payload))