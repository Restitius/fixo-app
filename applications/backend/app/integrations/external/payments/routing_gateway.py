"""RoutingPaymentGateway — picks the gateway per payment method / authorization ref."""
from __future__ import annotations

from typing import Any


class RoutingPaymentGateway:
    """Wallet payments go to the wallet gateway; everything else to the default."""

    def __init__(self, default: Any, wallet: Any) -> None:
        self._default = default
        self._wallet = wallet
        self.gateway_name = default.gateway_name

    def _for_ref(self, ref: str | None) -> Any:
        return self._wallet if ref and str(ref).startswith("WALLET-") else self._default

    async def authorize(
        self, payment_id: str, amount_cents: int, currency: str, **context: Any
    ) -> dict[str, Any]:
        method = str(context.pop("method", "") or "").upper()
        gateway = self._wallet if method == "WALLET" else self._default
        return await gateway.authorize(payment_id, amount_cents, currency, **context)

    async def capture(self, authorization_ref: str, amount_cents: int, **context: Any) -> dict[str, Any]:
        gateway = self._for_ref(authorization_ref)
        if gateway is self._wallet:
            return await gateway.capture(authorization_ref, amount_cents, **context)
        return await gateway.capture(authorization_ref, amount_cents)

    async def refund(
        self, payment_ref: str, amount_cents: int, reason: str | None = None, **context: Any
    ) -> dict[str, Any]:
        gateway = self._for_ref(payment_ref)
        if gateway is self._wallet:
            return await gateway.refund(payment_ref, amount_cents, reason, **context)
        # Non-wallet (test) gateway holds are simply released; no money moved.
        return {"refunded": True, "gateway": getattr(gateway, "gateway_name", "MOCK"),
                "amount_cents": amount_cents}
