"""Structured ratings: aspect validation and pass-through of tags / recommendation."""
from __future__ import annotations

import pytest

from app.domains.ratings.services.rating_service import RatingService


class FakeRatings:
    def __init__(self) -> None:
        self.calls: list[tuple] = []

    async def submit(self, booking_id, customer_id, rating, comment, aspects, tags, recommend):
        self.calls.append((booking_id, customer_id, rating, comment, aspects, tags, recommend))
        return {"rating_id": "r1", "rating": rating, "aspects": aspects, "tags": tags, "recommend": recommend}


class FakeBookings:
    def __init__(self) -> None:
        self.timeline: list[tuple] = []

    async def add_timeline(self, customer_id, booking_id, event, detail):
        self.timeline.append((event, detail))


async def test_valid_aspects_tags_and_recommendation_are_stored():
    repo = FakeRatings()
    svc = RatingService(repo, FakeBookings())
    out = await svc.submit(
        "b1", "c1", 5, "Great",
        aspects={"quality": 5, "punctuality": 4}, tags=["On time", "  ", "Friendly"], recommend=True,
    )
    assert out["aspects"] == {"quality": 5, "punctuality": 4}
    assert out["tags"] == ["On time", "Friendly"]
    assert out["recommend"] is True


@pytest.mark.parametrize("aspects", [{"cleanliness": 4}, {"quality": 0}, {"quality": 6}])
async def test_unknown_or_out_of_range_aspects_are_rejected(aspects):
    repo = FakeRatings()
    with pytest.raises(ValueError):
        await RatingService(repo, FakeBookings()).submit("b1", "c1", 4, aspects=aspects)
    assert repo.calls == []


async def test_at_most_eight_tags_of_forty_characters_are_kept():
    repo = FakeRatings()
    await RatingService(repo, FakeBookings()).submit(
        "b1", "c1", 4, tags=[f"tag{i}" + "x" * 60 for i in range(12)]
    )
    _, _, _, _, _, tags, _ = repo.calls[0]
    assert len(tags) == 8 and all(len(t) <= 40 for t in tags)


async def test_overall_rating_must_be_between_one_and_five():
    with pytest.raises(ValueError):
        await RatingService(FakeRatings(), FakeBookings()).submit("b1", "c1", 6)
