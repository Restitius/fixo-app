"""BookingSqlAdapter — implements BookingRepository via governed queries."""
from __future__ import annotations

from typing import Any

from app.platform.query.sql_query_manager import SQLQueryManager


class BookingQueryIds:
    CREATE = "CUS.BOOKING.CREATE"
    GET = "CUS.BOOKING.GET"
    GET_INTERNAL = "CUS.BOOKING.GET_INTERNAL"
    LIST = "CUS.BOOKING.LIST"
    SET_STATUS = "CUS.BOOKING.SET_STATUS"
    CLOSE = "CUS.BOOKING.CLOSE"
    TIMELINE_ADD = "CUS.BOOKING.TIMELINE.ADD"
    TIMELINE_LIST = "CUS.BOOKING.TIMELINE.LIST"
    SET_STATUS_INTERNAL = "CUS.BOOKING.SET_STATUS"
    TIMELINE_ADD_INTERNAL = "CUS.BOOKING.TIMELINE.ADD"


class BookingSqlAdapter:
    def __init__(self, sql_manager: SQLQueryManager) -> None:
        self._sql = sql_manager

    async def create(self, customer_id: str, quote_id: str) -> dict[str, Any] | None:
        return await self._sql.execute(
            BookingQueryIds.CREATE,
            {"customer_id": customer_id, "quote_id": quote_id},
            fetch="one",
        )

    async def get(self, customer_id: str, booking_id: str) -> dict[str, Any] | None:
        return await self._sql.execute(
            BookingQueryIds.GET,
            {"customer_id": customer_id, "booking_id": booking_id},
            fetch="one",
        )

    async def list(
        self, customer_id: str, *, status: str | None = None,
        limit: int = 20, offset: int = 0
    ) -> list[dict[str, Any]]:
        rows = await self._sql.execute(
            BookingQueryIds.LIST,
            {"customer_id": customer_id, "status": status,
             "limit": limit, "offset": offset},
            fetch="all",
        )
        return list(rows or [])

    async def set_status(
        self, customer_id: str, booking_id: str,
        *, from_state: str, to_state: str
    ) -> dict[str, Any] | None:
        return await self._sql.execute(
            BookingQueryIds.SET_STATUS,
            {"customer_id": customer_id, "booking_id": booking_id,
             "from_state": from_state, "to_state": to_state},
            fetch="one",
        )

    async def close(self, customer_id: str, booking_id: str) -> dict[str, Any] | None:
        """PAID -> CLOSED; flags warranty_eligible so the DB trigger issues it."""
        return await self._sql.execute(
            BookingQueryIds.CLOSE,
            {"customer_id": customer_id, "booking_id": booking_id},
            fetch="one",
        )

    async def add_timeline(
        self, customer_id: str, booking_id: str,
        event: str, detail: str | None = None
    ) -> bool:
        row = await self._sql.execute(
            BookingQueryIds.TIMELINE_ADD,
            {"customer_id": customer_id, "booking_id": booking_id,
             "event": event, "detail": detail},
            fetch="one",
        )
        return bool(row)

    async def timeline(self, customer_id: str, booking_id: str) -> list[dict[str, Any]]:
        rows = await self._sql.execute(
            BookingQueryIds.TIMELINE_LIST,
            {"customer_id": customer_id, "booking_id": booking_id},
            fetch="all",
        )
        return list(rows or [])

    # -- provider-side (internal channel; no customer filter) --------------------

    async def get_internal(self, booking_id: str) -> dict[str, Any] | None:
        return await self._sql.execute(
            BookingQueryIds.GET_INTERNAL,
            {"booking_id": booking_id},
            fetch="one",
        )

    async def set_arrived(self, booking_id: str) -> dict[str, Any] | None:
        return await self._sql.execute(
            "CUS.BOOKING.SET_ARRIVED", {"booking_id": booking_id}, fetch="one"
        )

    async def verify_arrival(
        self, customer_id: str, booking_id: str, code: str
    ) -> dict[str, Any] | None:
        return await self._sql.execute(
            "CUS.BOOKING.VERIFY_ARRIVAL",
            {"customer_id": customer_id, "booking_id": booking_id, "code": code},
            fetch="one",
        )

    async def set_status_internal(
        self, booking_id: str, *, customer_id: str,
        from_state: str, to_state: str
    ) -> dict[str, Any] | None:
        return await self._sql.execute(
            BookingQueryIds.SET_STATUS_INTERNAL,
            {"booking_id": booking_id, "customer_id": customer_id,
             "from_state": from_state, "to_state": to_state},
            fetch="one",
        )

    async def add_timeline_internal(
        self, booking_id: str, customer_id: str,
        event: str, detail: str | None
    ) -> bool:
        row = await self._sql.execute(
            BookingQueryIds.TIMELINE_ADD_INTERNAL,
            {"booking_id": booking_id, "customer_id": customer_id,
             "event": event, "detail": detail},
            fetch="one",
        )
        return bool(row)

    # -- Phase 8 execution stamps -------------------------------------------------

    async def mark_started(self, booking_id: str) -> dict[str, Any] | None:
        return await self._sql.execute(
            "CUS.BOOKING.MARK_STARTED", {"booking_id": booking_id}, fetch="one"
        )

    async def mark_completed(self, customer_id: str, booking_id: str) -> dict[str, Any] | None:
        return await self._sql.execute(
            "CUS.BOOKING.MARK_COMPLETED",
            {"customer_id": customer_id, "booking_id": booking_id},
            fetch="one",
        )

    async def update_amount(self, booking_id: str, amount: float) -> dict[str, Any] | None:
        return await self._sql.execute(
            "CUS.BOOKING.UPDATE_AMOUNT",
            {"booking_id": booking_id, "amount": amount},
            fetch="one",
        )

    async def set_scheduled_date(self, booking_id: str, scheduled_date: str) -> dict[str, Any] | None:
        return await self._sql.execute(
            "CUS.BOOKING.SET_SCHEDULE",
            {"booking_id": booking_id, "scheduled_date": scheduled_date},
            fetch="one",
        )

    async def set_scope_notes(self, booking_id: str, scope_notes: str) -> dict[str, Any] | None:
        return await self._sql.execute(
            "CUS.BOOKING.SET_SCOPE",
            {"booking_id": booking_id, "scope_notes": scope_notes},
            fetch="one",
        )