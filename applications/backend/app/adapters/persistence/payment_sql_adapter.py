"""PaymentSqlAdapter — implements PaymentRepository via governed queries."""
from __future__ import annotations

from typing import Any

from app.platform.query.sql_query_manager import SQLQueryManager


class PaymentQueryIds:
    CREATE_ATTEMPT = "CUS.PAYMENT.CREATE_ATTEMPT"
    SET_RESULT = "CUS.PAYMENT.SET_RESULT"
    GET_AUTHORIZATION = "CUS.PAYMENT.GET_AUTHORIZATION"
    MARK_CAPTURED = "CUS.PAYMENT.MARK_CAPTURED"


class PaymentSqlAdapter:
    def __init__(self, sql_manager: SQLQueryManager) -> None:
        self._sql = sql_manager

    async def create_attempt(
        self, customer_id: str, booking_id: str, gateway: str
    ) -> dict[str, Any] | None:
        return await self._sql.execute(
            PaymentQueryIds.CREATE_ATTEMPT,
            {"customer_id": customer_id, "booking_id": booking_id,
             "gateway": gateway},
            fetch="one",
        )

    async def set_result(
        self, customer_id: str, booking_id: str, payment_id: str,
        *, result: str, gateway_ref: str | None, failure_reason: str | None
    ) -> bool:
        row = await self._sql.execute(
            PaymentQueryIds.SET_RESULT,
            {"customer_id": customer_id, "booking_id": booking_id,
             "payment_id": payment_id, "result": result,
             "gateway_ref": gateway_ref, "failure_reason": failure_reason},
            fetch="one",
        )
        return bool(row)

    async def get_authorization(
        self, customer_id: str, booking_id: str
    ) -> dict[str, Any] | None:
        return await self._sql.execute(
            PaymentQueryIds.GET_AUTHORIZATION,
            {"customer_id": customer_id, "booking_id": booking_id},
            fetch="one",
        )

    async def mark_captured(
        self, customer_id: str, payment_id: str, capture_ref: str | None
    ) -> bool:
        row = await self._sql.execute(
            PaymentQueryIds.MARK_CAPTURED,
            {"customer_id": customer_id, "payment_id": payment_id,
             "capture_ref": capture_ref},
            fetch="one",
        )
        return bool(row)