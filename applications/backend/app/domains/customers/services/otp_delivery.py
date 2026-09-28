"""OtpDelivery — sends verification / reset codes over the customer's channels.

Delivery is best-effort: a provider outage must not turn a successful
registration into an error, and the caller decides what to do with the
returned flag. Codes are never logged.
"""
from __future__ import annotations

import logging
import uuid
from typing import Any

logger = logging.getLogger(__name__)

_PURPOSE_LABEL = {
    "VERIFY_EMAIL": "verify your email address",
    "VERIFY_PHONE": "verify your phone number",
    "PASSWORD_RESET": "reset your password",
}


def mask_destination(channel: str, destination: str) -> str:
    if channel == "EMAIL":
        local, _, domain = destination.partition("@")
        return f"{local[:1]}{'*' * max(1, len(local) - 1)}@{domain}"
    return f"{destination[:4]}{'*' * max(1, len(destination) - 7)}{destination[-3:]}"


class OtpDelivery:
    def __init__(self, messaging: Any, ttl_minutes: int = 10) -> None:
        self._messaging = messaging
        self._ttl_minutes = ttl_minutes

    async def deliver(self, *, channel: str, destination: str, code: str, purpose: str) -> bool:
        if self._messaging is None or not destination:
            return False
        action = _PURPOSE_LABEL.get(purpose, "continue")
        try:
            if channel == "SMS":
                await self._messaging.send_sms(
                    destination,
                    f"FIXO: {code} is your code to {action}. It expires in {self._ttl_minutes} minutes. "
                    "Never share it with anyone.",
                    reference=f"otp-{uuid.uuid4().hex}",
                )
            else:
                await self._messaging.send_email(
                    destination,
                    "Your FIXO verification code",
                    f"Use code {code} to {action}.\n\nThe code expires in {self._ttl_minutes} minutes. "
                    "If you did not request it, you can ignore this message. Never share this code.",
                )
            return True
        except Exception as exc:  # noqa: BLE001 - delivery must never break the auth flow
            logger.warning(
                "OTP delivery failed channel=%s dest=%s: %s",
                channel,
                mask_destination(channel, destination),
                exc,
            )
            return False
