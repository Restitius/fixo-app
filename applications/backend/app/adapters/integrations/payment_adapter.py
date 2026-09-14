"""PaymentIntegrationAdapter — implements the PaymentGateway port.

    PaymentApplicationService -> PaymentGateway (port) -> PaymentIntegrationAdapter
                             -> IntegrationManager -> IntegrationRegistry -> Provider
"""
from __future__ import annotations

from typing import Any

from app.integrations.external.manager import IntegrationManager


class PaymentGatewayIntegrationIds:
    """Stable INT-* IDs for payment operations (adapter-private)."""

    MOBILE_MONEY = "INT.PAYMENT.MOBILE_MONEY.V1"
    CARD = "INT.PAYMENT.CARD.V1"


class PaymentIntegrationAdapter:
    """Provider-agnostic payment surface backed by the integration manager."""

    def __init__(self, integration_manager: IntegrationManager) -> None:
        self._integrations = integration_manager

    async def authorize(self, payment_id: str, amount_cents: int, currency: str, **context: Any) -> dict[str, Any]:
        return await self._integrations.execute(
            PaymentGatewayIntegrationIds.MOBILE_MONEY,
            "authorize",
            {"payment_id": payment_id, "amount_cents": amount_cents, "currency": currency, **context},
        )

    async def capture(self, authorization_ref: str, amount_cents: int) -> dict[str, Any]:
        return await self._integrations.execute(
            PaymentGatewayIntegrationIds.MOBILE_MONEY,
            "capture",
            {"authorization_ref": authorization_ref, "amount_cents": amount_cents},
        )

    async def refund(self, payment_ref: str, amount_cents: int, reason: str | None = None) -> dict[str, Any]:
        return await self._integrations.execute(
            PaymentGatewayIntegrationIds.MOBILE_MONEY,
            "refund",
            {"payment_ref": payment_ref, "amount_cents": amount_cents, "reason": reason},
        )