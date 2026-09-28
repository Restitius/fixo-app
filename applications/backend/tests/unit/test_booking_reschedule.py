"""Customer rescheduling: input validation, eligibility and the reschedule limit."""
from __future__ import annotations

from datetime import date, timedelta

import pytest

from app.domains.bookings.services.booking_service import BookingService
from app.shared.exceptions.hierarchy import ValidationError


class FakeBookings:
    def __init__(self, status="PAYMENT_AUTHORIZED", count=0, when=None, window="MORNING") -> None:
        self.booking = {
            "booking_id": "b1", "booking_number": "BK-1", "status": status,
            "reschedule_count": count, "scheduled_date": when or date.today() + timedelta(days=3),
            "time_window": window,
        }
        self.calls: list[tuple] = []
        self.accept = True

    async def get(self, customer_id, booking_id):
        return dict(self.booking)

    async def reschedule(self, customer_id, booking_id, scheduled_date, time_window, max_reschedules, detail):
        self.calls.append((scheduled_date, time_window, max_reschedules, detail))
        if not self.accept:
            return None
        self.booking["scheduled_date"] = scheduled_date
        self.booking["time_window"] = time_window
        self.booking["reschedule_count"] += 1
        return {"booking_id": booking_id}


def service(bookings: FakeBookings) -> BookingService:
    return BookingService(bookings, None, None, None, None, None)


def days(n: int) -> str:
    return (date.today() + timedelta(days=n)).isoformat()


async def test_moves_the_booking_and_records_the_reason():
    repo = FakeBookings()
    out = await service(repo).reschedule("c1", "b1", days(7), "afternoon", "  Travelling  ")
    assert out["time_window"] == "AFTERNOON" and out["reschedule_count"] == 1
    _, window, limit, detail = repo.calls[0]
    assert window == "AFTERNOON" and limit == 2 and detail.endswith(": Travelling")


@pytest.mark.parametrize(
    "when,window",
    [("soon", "MORNING"), ("2020-01-01", "MORNING"), (date.today().isoformat(), "MORNING"), (days(400), "MORNING"), (days(5), "NIGHT")],
)
async def test_invalid_input_is_rejected_without_touching_the_booking(when, window):
    repo = FakeBookings()
    with pytest.raises(ValidationError):
        await service(repo).reschedule("c1", "b1", when, window)
    assert repo.calls == []


@pytest.mark.parametrize("status", ["ON_THE_WAY", "ARRIVED", "IN_PROGRESS", "CLOSED", "CANCELLED", "PAID"])
async def test_only_bookings_that_have_not_started_can_move(status):
    repo = FakeBookings(status=status)
    with pytest.raises(ValidationError):
        await service(repo).reschedule("c1", "b1", days(7), "MORNING")
    assert repo.calls == []


async def test_a_booking_can_move_at_most_twice():
    repo = FakeBookings(count=2)
    with pytest.raises(ValidationError, match="at most 2"):
        await service(repo).reschedule("c1", "b1", days(7), "MORNING")
    assert repo.calls == []


async def test_moving_to_the_current_slot_is_rejected():
    repo = FakeBookings(when=date.today() + timedelta(days=7), window="MORNING")
    with pytest.raises(ValidationError, match="already scheduled"):
        await service(repo).reschedule("c1", "b1", days(7), "MORNING")


async def test_losing_a_race_with_the_sql_guard_is_reported():
    repo = FakeBookings()
    repo.accept = False
    with pytest.raises(ValidationError, match="no longer"):
        await service(repo).reschedule("c1", "b1", days(7), "MORNING")
