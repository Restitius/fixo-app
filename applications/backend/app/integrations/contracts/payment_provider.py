"""PaymentProvider contract — charge/refund surface for payment gateways."""
from __future__ import annotations

from abc import abstractmethod
from typing import Any

from app.integrations.contracts.base_integration import BaseIntegration


class PaymentProvider(BaseIntegration):
    @abstractmethod
    async def charge(self, payment_ref: str, amount: float, currency: str, metadata: dict[str, Any] | None = None) -> dict[str, Any]:
        """Charge a payment reference; returns provider receipt payload."""

    @abstractmethod
    async def refund(self, transaction_ref: str, amount: float | None = None) -> dict[str, Any]:
        """Refund fully or partially by provider transaction reference."""
