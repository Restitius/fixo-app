"""ProviderJobReviewSqlAdapter - implemented via governed queries (Phase 26).

Owns the PROV.REVIEW.* query ids. Records the customer's sign-off / approval
evidence against a booking in COMPLETION_REQUESTED; surfaces the triage list
of bookings awaiting sign-off beyond the 24h silent-effectiveness window.
"""
from __future__ import annotations

from typing import Any

from app.ports.persistence.provider_job_review_repository import (
    ProviderJobReviewRepository,
)


class ProviderJobReviewQueryIds:
    SUBMIT  = "PROV.REVIEW.SUBMIT"
    GET     = "PROV.REVIEW.GET"
    WAITING = "PROV.REVIEW.WAITING"
    DELETE  = "PROV.REVIEW.DELETE"


class ProviderJobReviewSqlAdapter(ProviderJobReviewRepository):
    def __init__(self, sql_query_manager: Any) -> None:
        self._sql = sql_query_manager

    async def submit(
        self,
        user_id: str,
        booking_id: str,
        sign_off: str,
        approval_evidence: str,
    ) -> dict[str, Any] | None:
        return await self._sql.execute(
            ProviderJobReviewQueryIds.SUBMIT,
            {
                "user_id": user_id,
                "booking_id": booking_id,
                "sign_off": sign_off,
                "approval_evidence": approval_evidence,
            },
            fetch="one",
        )

    async def get(self, user_id: str, booking_id: str) -> dict[str, Any] | None:
        return await self._sql.execute(
            ProviderJobReviewQueryIds.GET,
            {
                "user_id": user_id,
                "booking_id": booking_id,
            },
            fetch="one",
        )

    async def waiting(self, user_id: str) -> list[dict[str, Any]]:
        rows = await self._sql.execute(
            ProviderJobReviewQueryIds.WAITING,
            {
                "user_id": user_id,
            },
            fetch="all",
        )
        return list(rows or [])

    async def delete(self, user_id: str, review_id: str) -> dict[str, Any] | None:
        return await self._sql.execute(
            ProviderJobReviewQueryIds.DELETE,
            {
                "user_id": user_id,
                "review_id": review_id,
            },
            fetch="one",
        )
