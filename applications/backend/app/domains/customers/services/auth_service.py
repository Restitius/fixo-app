"""AuthService — customer registration, login, OTP verification, sessions.

Depends ONLY on ports (CustomerRepository, OtpRepository, SessionRepository,
EventPublisher) plus pure security helpers. No SQL, no query IDs.
"""
from __future__ import annotations

import hashlib
import logging
import re
import secrets
from typing import Any

from app.config import get_settings
from app.domains.customers.services.otp_delivery import OtpDelivery, mask_destination
from app.security.jwt import JwtService
from app.security.password import PasswordHasher
from app.shared.exceptions.hierarchy import (
    AuthenticationError,
    ConflictError,
    NotFoundError,
    RateLimitError,
    ValidationError,
)

logger = logging.getLogger(__name__)


def _dev_mode() -> bool:
    """Surface OTP codes in responses only outside production.

    Until real SMS/email adapters land, this is how a developer or tester
    obtains the code at all — but it must never be reachable in production,
    where it would let anyone take over any account by requesting an OTP for
    the victim's email/phone and reading the code straight out of the
    response body.
    """
    return get_settings().environment != "production"


OTP_TTL_MINUTES = 10
OTP_RESEND_COOLDOWN_SECONDS = 30
OTP_MAX_ISSUES_PER_HOUR = 5

# OTP channel -> purpose stored in OTP_CODES
_CHANNELS = {"EMAIL": "VERIFY_EMAIL", "SMS": "VERIFY_PHONE"}

_PHONE_NOISE_RE = re.compile(r"[\s\-().]")
_E164_RE = re.compile(r"^\+[1-9]\d{7,14}$")


def normalize_phone(raw: str) -> str:
    """Strip formatting and require international (E.164) format."""
    phone = _PHONE_NOISE_RE.sub("", raw or "")
    if phone.startswith("00"):
        phone = "+" + phone[2:]
    if not _E164_RE.match(phone):
        raise ValidationError(
            "Enter a valid phone number in international format, e.g. +255754321987"
        )
    return phone


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
        otp_delivery: OtpDelivery | None = None,
    ) -> None:
        self._delivery = otp_delivery
        self._customers = customers
        self._otps = otps
        self._sessions = sessions
        self._hasher = hasher
        self._jwt = jwt_service
        self._events = events

    # -- registration + verification -----------------------------------------

    async def register(self, data: dict[str, Any]) -> dict[str, Any]:
        if not data.get("terms_accepted") or not data.get("privacy_accepted"):
            raise ValidationError(
                "You must accept the Terms and Conditions and the Privacy Policy to register"
            )
        phone = normalize_phone(data["phone"])
        email = data["email"].strip().lower()
        if await self._customers.get_by_email(email):
            raise ConflictError("An account with this email already exists")

        row = await self._customers.create(
            {
                "full_name": data["full_name"].strip(),
                "phone": phone,
                "email": email,
                "password_hash": self._hasher.hash(data["password"]),
                "preferred_language": data.get("preferred_language", "en"),
                "terms_accepted": True,
                "privacy_accepted": True,
            }
        )
        if not row:
            raise ValidationError("Registration failed")

        email_code = await self._issue_and_deliver(row["customer_id"], "EMAIL", email)
        phone_code = await self._issue_and_deliver(row["customer_id"], "SMS", phone)
        await self._publish("EVT.CUSTOMER.REGISTERED", row)
        dev_codes: dict[str, Any] = {}
        if _dev_mode():
            dev_codes = {"otp_code": email_code, "phone_otp_code": phone_code}
        return {**row, **dev_codes}

    async def request_otp(self, email: str, channel: str = "EMAIL") -> dict[str, Any]:
        channel = self._channel(channel)
        customer = await self._customers.get_by_email(email.strip().lower())
        if not customer:
            # Do not reveal account existence.
            return {"sent": True, "channel": channel}
        verified_key = "email_verified" if channel == "EMAIL" else "phone_verified"
        if customer.get(verified_key):
            raise ConflictError(
                "This email address is already verified"
                if channel == "EMAIL"
                else "This phone number is already verified"
            )
        destination = customer["email"] if channel == "EMAIL" else customer["phone"]
        await self._enforce_resend_limits(customer["customer_id"], _CHANNELS[channel])
        code = await self._issue_and_deliver(customer["customer_id"], channel, destination)
        return {
            "sent": True,
            "channel": channel,
            "destination": mask_destination(
                channel, destination if channel == "EMAIL" else self._sms_number(destination)
            ),
            **({"otp_code": code} if _dev_mode() else {}),
        }

    async def request_password_reset(self, email: str) -> dict[str, Any]:
        customer = await self._customers.get_by_email(email.strip().lower())
        if not customer:
            # Do not reveal account existence.
            return {"sent": True}
        try:
            await self._enforce_resend_limits(customer["customer_id"], "PASSWORD_RESET")
        except RateLimitError:
            # Same response as an unknown account so limits can't be probed.
            return {"sent": True}
        code = await self._issue_and_deliver(
            customer["customer_id"], "EMAIL", customer["email"], purpose="PASSWORD_RESET"
        )
        return {"sent": True, **({"otp_code": code} if _dev_mode() else {})}

    async def reset_password(self, email: str, code: str, new_password: str) -> dict[str, Any]:
        if len(new_password) < 8:
            raise ValidationError("Password must be at least 8 characters")
        customer = await self._require_customer(email)
        ok = await self._otps.verify(
            customer["customer_id"],
            {"purpose": "PASSWORD_RESET", "code_hash": _hash_code(code)},
        )
        if not ok:
            raise AuthenticationError("Invalid or expired reset code")

        updated = await self._customers.update_password(
            customer["customer_id"], self._hasher.hash(new_password)
        )
        if not updated:
            raise ValidationError("Could not reset the password")
        # A forgotten-then-reset password means any existing session may have
        # been on a compromised device — force re-login everywhere.
        await self._sessions.revoke_all(str(customer["customer_id"]))
        await self._publish("EVT.CUSTOMER.PASSWORD_RESET", updated)
        return {"reset": True}

    async def verify_otp(self, email: str, code: str, channel: str = "EMAIL") -> dict[str, Any]:
        channel = self._channel(channel)
        customer = await self._require_customer(email)
        ok = await self._otps.verify(
            customer["customer_id"],
            {"purpose": _CHANNELS[channel], "code_hash": _hash_code(code)},
        )
        if not ok:
            raise AuthenticationError("Invalid or expired verification code")

        updated = await self._customers.mark_verified(
            customer["customer_id"], email=channel == "EMAIL", phone=channel == "SMS"
        )
        await self._publish("EVT.CUSTOMER.VERIFIED", updated or customer)
        current = updated or {}
        return {
            "verified": True,
            "channel": channel,
            "customer_id": customer["customer_id"],
            "email_verified": bool(current.get("email_verified", customer.get("email_verified"))),
            "phone_verified": bool(current.get("phone_verified", customer.get("phone_verified"))),
        }

    # -- login / tokens --------------------------------------------------------

    async def login(self, email: str, password: str, device_info: str = "", ip: str = "") -> dict[str, Any]:
        auth_row = await self._customers.get_by_email(email.strip().lower())
        if not auth_row or not self._hasher.verify(password, auth_row["password_hash"]):
            raise AuthenticationError("Invalid email or password")
        if auth_row["status"] != "ACTIVE":
            raise AuthenticationError(
                f"Account status '{auth_row['status']}' does not permit login"
            )
        # by_email.sql's row includes password_hash (needed above to verify
        # it) — re-fetch the safe representation (by_id.sql has no hash
        # column at all) rather than passing the raw auth row's hash to the
        # client. Same real bug found and fixed on the provider side this
        # session: the login response's embedded "customer"/"provider"
        # object was being stored client-side with a real bcrypt hash
        # inside it.
        customer = await self._customers.get_by_id(str(auth_row["customer_id"]))
        if not customer:
            raise AuthenticationError("Account no longer exists")
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

    async def update_profile(self, user_id: str, data: dict[str, Any]) -> dict[str, Any]:
        params = {
            "full_name": data["full_name"].strip() if data.get("full_name") else None,
            "phone": normalize_phone(data["phone"]) if data.get("phone") else None,
            "preferred_language": data.get("preferred_language") or None,
        }
        before = await self._customers.get_by_id(user_id)
        if not before:
            raise NotFoundError("Customer not found")
        updated = await self._customers.update_profile(user_id, params)
        if not updated:
            raise NotFoundError("Customer not found")
        await self._publish("EVT.CUSTOMER.PROFILE_UPDATED", updated)
        # update_profile.sql only RETURNINGs the columns it touches — re-fetch
        # the full row so the response matches /auth/me's shape (email_verified,
        # phone_verified, created_at, etc. that the client keeps in state).
        fresh = await self._customers.get_by_id(user_id)
        if params["phone"] and params["phone"] != before["phone"]:
            # A corrected number must be re-verified; send the new code right away.
            code = await self._issue_and_deliver(user_id, "SMS", params["phone"])
            if _dev_mode():
                return {**fresh, "phone_otp_code": code}
        return fresh

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

    @staticmethod
    def _channel(channel: str) -> str:
        channel = (channel or "EMAIL").upper()
        if channel not in _CHANNELS:
            raise ValidationError("Verification channel must be EMAIL or SMS")
        return channel

    @staticmethod
    def _sms_number(phone: str) -> str:
        phone = _PHONE_NOISE_RE.sub("", phone or "")
        return phone if phone.startswith("+") else f"+{phone}"

    async def _enforce_resend_limits(self, customer_id: str, purpose: str) -> None:
        activity = await self._otps.recent_activity(str(customer_id), purpose, 3600)
        if activity["seconds_since_last"] < OTP_RESEND_COOLDOWN_SECONDS:
            wait = int(OTP_RESEND_COOLDOWN_SECONDS - activity["seconds_since_last"]) + 1
            raise RateLimitError(f"Please wait {wait} seconds before requesting another code")
        if activity["issued"] >= OTP_MAX_ISSUES_PER_HOUR:
            raise RateLimitError("Too many verification codes requested. Try again in an hour")

    async def _issue_and_deliver(
        self, customer_id: str, channel: str, destination: str, purpose: str | None = None
    ) -> str:
        purpose = purpose or _CHANNELS[channel]
        code = await self._issue_otp(customer_id, purpose, channel)
        if self._delivery is not None:
            target = destination if channel == "EMAIL" else self._sms_number(destination)
            await self._delivery.deliver(
                channel=channel, destination=target, code=code, purpose=purpose
            )
        return code

    async def _issue_otp(self, customer_id: str, purpose: str, channel: str = "EMAIL") -> str:
        code = f"{secrets.randbelow(1_000_000):06d}"
        await self._otps.issue(
            customer_id,
            {
                "channel": channel,
                "purpose": purpose,
                "code_hash": _hash_code(code),
                "ttl_minutes": OTP_TTL_MINUTES,
            },
        )
        logger.info("OTP issued for %s (%s via %s)", customer_id, purpose, channel)
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