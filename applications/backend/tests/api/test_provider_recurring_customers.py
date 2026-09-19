"""Integration tests for Phase 42 - provider recurring (repeat) customers.

Exercises the full registry-driven SQL adapter path through the real
composition root, against a real (customer, provider) pair with at least
one CLOSED booking. The "2+ completed bookings" list threshold isn't
independently exercised here since synthesizing a second valid CLOSED
booking would require cloning FKs across several NOT NULL/unique
constraints (request_id, quote_id) — the LIST query's structure was
verified live during development instead.

Self-cleaning: the fixture teardown deletes any row written to
PROVIDER_CUSTOMER_NOTES.
"""
from __future__ import annotations

from typing import Any

import pytest
from sqlalchemy import text

from app.bootstrap import Bootstrap
from app.shared.exceptions.hierarchy import NotFoundError
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
async def _pair():
    if _comp is None:
        pytest.skip("Composition not bootstrapped")
    async with _engine.begin() as conn:
        row = (await conn.execute(text("""
            SELECT customer_id, provider_id FROM "BOOKINGS"
             WHERE status = 'CLOSED'
             GROUP BY customer_id, provider_id
             LIMIT 1
        """))).first()
        other = (await conn.execute(text(
            'SELECT provider_id FROM "PROVIDERS" WHERE provider_id != :pid LIMIT 1'
        ), {"pid": str(row[1]) if row else None})).first() if row else None
    if row is None or other is None:
        pytest.skip("Need a (customer, provider) pair with a CLOSED booking, plus a second provider")
    yield {"customer_id": str(row[0]), "provider_id": str(row[1]), "other_provider_id": str(other[0])}


@pytest.fixture()
async def _cleanup_note(_pair):
    yield
    async with _engine.begin() as conn:
        await conn.execute(
            text('DELETE FROM "PROVIDER_CUSTOMER_NOTES" WHERE provider_id = :pid AND customer_id = :cid'),
            {"pid": _pair["provider_id"], "cid": _pair["customer_id"]},
        )


@pytest.mark.asyncio
async def test_customer_detail_bookings_and_note(_pair, _cleanup_note):
    svc = _comp.provider_recurring_customers_service()
    pid, cid, other_pid = _pair["provider_id"], _pair["customer_id"], _pair["other_provider_id"]

    detail = await svc.get_customer(pid, customer_id=cid)
    assert detail["total_bookings"] >= 1
    assert detail["note"] is None

    bookings = await svc.list_bookings(pid, customer_id=cid)
    assert len(bookings) >= 1

    saved = await svc.set_note(pid, customer_id=cid, note="Prefers morning appointments.")
    assert saved["note"] == "Prefers morning appointments."

    updated = await svc.get_customer(pid, customer_id=cid)
    assert updated["note"] == "Prefers morning appointments."

    with pytest.raises(NotFoundError):
        await svc.get_customer(other_pid, customer_id=cid)
    with pytest.raises(NotFoundError):
        await svc.set_note(other_pid, customer_id=cid, note="should fail")


@pytest.mark.asyncio
async def test_list_customers_returns_without_error(_pair):
    svc = _comp.provider_recurring_customers_service()
    result = await svc.list_customers(_pair["provider_id"])
    assert isinstance(result, list)
