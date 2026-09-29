"""Promo codes at checkout: discount resolution, and that a bad or reused
code never lets a booking through undiscounted."""
from __future__ import annotations

import pytest

from app.domains.bookings.services.booking_service import BookingService
from app.shared.exceptions.hierarchy import ValidationError


class FakeQuotations:
    def __init__(self, amount=28000.0) -> None:
        self.quote = {"quote_id": "q1", "status": "ACCEPTED", "request_id": "r1", "amount": amount}

    async def get_owned(self, customer_id, quote_id):
        return dict(self.quote)


class FakeRequests:
    def __init__(self) -> None:
        self.request = {"request_id": "r1", "status": "QUOTE_ACCEPTED"}

    async def get(self, customer_id, request_id):
        return dict(self.request)

    async def set_status(self, *a, **kw):
        return True


class FakeWorkflows:
    async def transition(self, *a, **kw):
        return None


class FakeBookings:
    def __init__(self) -> None:
        self.calls: list[tuple] = []
        self.timeline: list[tuple] = []
        self.accept = True

    async def create(self, customer_id, quote_id, promo_id=None, promo_code=None, discount_amount=0):
        self.calls.append((customer_id, quote_id, promo_id, promo_code, discount_amount))
        if not self.accept:
            return None
        self.last = {
            "booking_id": "b1", "booking_number": "BK-1", "status": "CONFIRMED",
            "agreed_amount": 28000.0 - (discount_amount or 0), "currency": "TZS",
            "arrival_code": "111111", "discount_amount": discount_amount or 0,
        }
        return self.last

    async def add_timeline(self, customer_id, booking_id, event, detail):
        self.timeline.append((event, detail))

    async def get(self, customer_id, booking_id):
        return dict(self.last)


class FakePromotions:
    def __init__(self) -> None:
        self.calls: list[tuple] = []
        self.row: dict | None = {
            "promo_id": "p1", "code": "WELCOME10", "discount_amount": 2800.0,
        }
        self.error: str | None = None

    async def validate(self, code, amount, customer_id=None):
        self.calls.append((code, amount, customer_id))
        if self.error:
            raise ValueError(self.error)
        return dict(self.row) if self.row else None


def service(bookings=None, promotions=None) -> tuple[BookingService, FakeBookings, FakePromotions]:
    b = bookings or FakeBookings()
    p = FakePromotions() if promotions is None else promotions
    svc = BookingService(b, None, FakeQuotations(), FakeRequests(), None, FakeWorkflows(), promotions=p)
    return svc, b, p


async def test_a_valid_code_discounts_the_booking_and_is_recorded():
    svc, bookings, promotions = service()
    out = await svc.confirm_from_quote("c1", "q1", "welcome10")
    assert promotions.calls == [("WELCOME10", 28000.0, "c1")]  # normalized, validated against the real quote amount
    _, _, promo_id, promo_code, discount = bookings.calls[0]
    assert (promo_id, promo_code, discount) == ("p1", "WELCOME10", 2800.0)
    assert out["agreed_amount"] == 28000.0 - 2800.0
    assert "promo WELCOME10 saved" in bookings.timeline[0][1]


async def test_no_code_books_at_full_price():
    svc, bookings, promotions = service()
    out = await svc.confirm_from_quote("c1", "q1", None)
    assert promotions.calls == []
    assert bookings.calls[0][2:] == (None, None, 0)
    assert out["agreed_amount"] == 28000.0


async def test_an_invalid_or_expired_code_is_rejected_before_any_booking_is_made():
    promotions = FakePromotions()
    promotions.error = "Promotion code is not valid or has expired"
    svc, bookings, _ = service(promotions=promotions)
    with pytest.raises(ValidationError, match="not valid or has expired"):
        await svc.confirm_from_quote("c1", "q1", "FAKECODE")
    assert bookings.calls == []


async def test_a_code_that_lost_a_redemption_race_reports_the_promo_not_the_booking():
    bookings = FakeBookings()
    bookings.accept = False
    svc, bookings, _ = service(bookings=bookings)
    with pytest.raises(ValidationError, match="just used up"):
        await svc.confirm_from_quote("c1", "q1", "WELCOME10")


async def test_a_plain_booking_that_fails_reports_generically():
    bookings = FakeBookings()
    bookings.accept = False
    svc, bookings, _ = service(bookings=bookings)
    with pytest.raises(ValidationError, match="Could not create the booking"):
        await svc.confirm_from_quote("c1", "q1", None)


async def test_no_promotions_dependency_means_a_code_cannot_be_applied():
    svc = BookingService(FakeBookings(), None, FakeQuotations(), FakeRequests(), None, FakeWorkflows())
    with pytest.raises(ValidationError, match="not valid"):
        await svc.confirm_from_quote("c1", "q1", "WELCOME10")
