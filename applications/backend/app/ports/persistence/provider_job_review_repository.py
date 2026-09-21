"""ProviderJobReviewRepository - port: rules for recording & reading customer sign-off.

Provider Phase 26: the customer records a DIGITAL_SIGNATURE / COMPLETION_PIN /
APP_CONFIRMATION sign-off against a booking in COMPLETION_REQUESTED. One approval
record per booking (UNIQUE). The status transition COMPLETION_REQUESTED ->
CUSTOMER_CONFIRMED stays owned by the customer-domain CompletionService.
"""
from __future__ import annotations

from typing import Any


class ProviderJobReviewRepository:
    """Abstract port - implemented by ProviderJobReviewSqlAdapter."""

    async def submit(
        self,
        user_id: str,
        booking_id: str,
        sign_off: str,
        approval_evidence: str,
    ) -> dict[str, Any] | None:
        raise NotImplementedError

    async def get(self, user_id: str, booking_id: str) -> dict[str, Any] | None:
        raise NotImplementedError

    async def waiting(self, user_id: str) -> list[dict[str, Any]]:
        raise NotImplementedError

    async def delete(self, user_id: str, review_id: str) -> dict[str, Any] | None:
        raise NotImplementedError
