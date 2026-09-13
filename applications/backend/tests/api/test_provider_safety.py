"""Integration tests for Phase 41 - provider safety & incident reporting.

Exercises the full registry-driven SQL adapter path through the real
composition root: create (with and without a booking) -> list -> get ->
escalate -> re-escalate rejected, plus the booking-ownership guard (a
report cannot be filed against another provider's booking).

Self-cleaning: the fixture teardown deletes any rows written to
PROVIDER_SAFETY_REPORTS.
"""
from __future__ import annotations

from typing import Any

import pytest
from sqlalchemy import text

from app.bootstrap import Bootstrap
from app.shared.exceptions.hierarchy import ConflictError, NotFoundError
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
async def _providers():
    if _comp is None:
        pytest.skip("Composition not bootstrapped")
    async with _engine.begin() as conn:
        rows = (await conn.execute(
            text('SELECT provider_id FROM "PROVIDERS" ORDER BY created_at LIMIT 2')
        )).fetchall()
        booking = (await conn.execute(
            text('SELECT booking_id, provider_id FROM "BOOKINGS" WHERE provider_id IS NOT NULL LIMIT 1')
        )).first()
    if len(rows) < 2 or booking is None:
        pytest.skip("Need at least two providers and one booking in the database")
    owner_pid = str(booking[1])
    other_pid = next((str(r[0]) for r in rows if str(r[0]) != owner_pid), None)
    if other_pid is None:
        pytest.skip("Need a second, different provider in the database")
    yield {"owner_pid": owner_pid, "other_pid": other_pid, "booking_id": str(booking[0])}


@pytest.fixture()
async def _cleanup_reports():
    created: list[str] = []
    yield created
    if created:
        async with _engine.begin() as conn:
            for rid in created:
                await conn.execute(
                    text('DELETE FROM "PROVIDER_SAFETY_REPORTS" WHERE report_id = :rid'),
                    {"rid": rid},
                )


@pytest.mark.asyncio
async def test_full_report_flow(_providers, _cleanup_reports):
    owner_pid = _providers["owner_pid"]
    other_pid = _providers["other_pid"]
    svc = _comp.provider_safety_service()

    report = await svc.create_report(
        owner_pid, booking_id=None, category="PROPERTY_HAZARD", severity="HIGH",
        description="Loose electrical wiring found at the job site.",
    )
    _cleanup_reports.append(str(report["report_id"]))
    assert report["status"] == "OPEN"
    assert report["category"] == "PROPERTY_HAZARD"

    reports = await svc.list_reports(owner_pid)
    assert any(r["report_id"] == report["report_id"] for r in reports)

    got = await svc.get_report(owner_pid, report_id=str(report["report_id"]))
    assert got["severity"] == "HIGH"

    escalated = await svc.escalate(owner_pid, report_id=str(report["report_id"]))
    assert escalated["status"] == "ESCALATED"
    assert escalated["escalated_at"] is not None

    with pytest.raises(ConflictError):
        await svc.escalate(owner_pid, report_id=str(report["report_id"]))

    with pytest.raises(NotFoundError):
        await svc.get_report(other_pid, report_id=str(report["report_id"]))


@pytest.mark.asyncio
async def test_create_rejects_other_providers_booking(_providers):
    svc = _comp.provider_safety_service()
    with pytest.raises(NotFoundError):
        await svc.create_report(
            _providers["other_pid"], booking_id=_providers["booking_id"],
            category="INJURY", severity="CRITICAL",
            description="Fell off a ladder during the job.",
        )
