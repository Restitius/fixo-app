"""MockPaymentGateway — dev/test stand-in implementing PaymentGateway.

Replace with M-Pesa / card adapters (integrations/external/payments/*) when
real provider credentials land; the port contract does not change.
"""
from __future__ import annotations

import secrets
from typing import Any


class MockPaymentGateway:
    """Authorizes positive amounts; capture/refund arrive with Phase 9."""

    gateway_name = "MOCK"

    async def authorize(
        self, payment_id: str, amount_cents: int, currency: str, **context: Any
    ) -> dict[str, Any]:
        if amount_cents <= 0:
            return {
                "authorized": False,
                "gateway_ref": None,
                "failure_reason": "Non-positive amount",
                "gateway": self.gateway_name,
            }
        ref = f"{self.gateway_name}-AUTH-{secrets.token_hex(4).upper()}"
        return {
            "authorized": True,
            "gateway_ref": ref,
            "failure_reason": None,
            "gateway": self.gateway_name,
            "payment_id": payment_id,
        }

    async def capture(self, authorization_ref: str, amount_cents: int) -> dict[str, Any]:
        if amount_cents <= 0:
            return {"captured": False, "failure_reason": "Non-positive amount",
                    "gateway": self.gateway_name}
        if not authorization_ref or not authorization_ref.startswith("MOCK-AUTH-"):
            return {"captured": False,
                    "failure_reason": f"Unknown authorization {authorization_ref}",
                    "gateway": self.gateway_name}
        return {
            "captured": True,
            "capture_ref": f"{self.gateway_name}-CAP-{secrets.token_hex(4).upper()}",
            "gateway": self.gateway_name,
            "authorization_ref": authorization_ref,
        }

    async def refund(
        self, payment_ref: str, amount_cents: int, reason: str | None = None
    ) -> dict[str, Any]:
        raise NotImplementedError("Refund lands with Phase 13 (cancellations)")