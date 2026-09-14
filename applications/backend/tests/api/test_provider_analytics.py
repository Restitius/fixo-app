"""Integration tests for Phase 49 - provider analytics overview.

Exercises the full registry-driven SQL adapter path through the real
composition root: the monthly trend query returns exactly `months`
buckets in chronological order with zero-filled gaps, and rejects an
out-of-range window. Content assertions are kept structural (not tied
to specific revenue/customer counts) since they depend on whatever real
booking history exists in the seed database.
"""
from __future__ import annotations

import datetime
from typing import Any

import pytest
from sqlalchemy import text

from app.bootstrap import Bootstrap
from app.shared.exceptions.hierarchy import ValidationError
from app.startup.composition import get_composition

_engine: Any = None
_comp: Any = None


@pytest.fixture(scope="session", autouse=True)
async def _ensure_composition():
    global _engine, _comp
    if _comp is None:
        boot = Bootstrap()
        await boot.run_startup()
        _comp = get_composition()
        _engine = _comp.sql_query_manager._databases.engine_for("PRIMARY_DB")
    yield
    if _engine is not None:
        await _engine.dispose()


@pytest.fixture()
async def _provider():
    if _comp is None:
        pytest.skip("Composition not bootstrapped")
    async with _engine.begin() as conn:
        row = (await conn.execute(text('SELECT provider_id FROM "PROVIDERS" LIMIT 1'))).first()
    if row is None:
        pytest.skip("Need at least one provider in the database")
    yield str(row[0])


@pytest.mark.asyncio
async def test_overview_shape_and_zero_filling(_provider):
    svc = _comp.provider_analytics_service()
    months = 6

    overview = await svc.overview(_provider, months=months)
    assert len(overview) == months

    periods = [row["period"] for row in overview]
    assert periods == sorted(periods), "periods must be chronological"

    today_month = datetime.date.today().replace(day=1)
    last_period = periods[-1]
    last_period_date = last_period if isinstance(last_period, datetime.date) else datetime.date.fromisoformat(str(last_period))
    assert last_period_date == today_month

    for row in overview:
        assert row["bookings_completed"] >= 0
        assert row["revenue"] >= 0
        assert row["new_customers"] >= 0
        assert row["repeat_customers"] >= 0


@pytest.mark.asyncio
async def test_months_out_of_range_rejected(_provider):
    svc = _comp.provider_analytics_service()
    with pytest.raises(ValidationError):
        await svc.overview(_provider, months=0)
    with pytest.raises(ValidationError):
        await svc.overview(_provider, months=25)
