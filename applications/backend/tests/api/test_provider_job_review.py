"""Integration tests for Phase 26 - provider job sign-off / review flow.

Exercises the full registry-driven SQL adapter path through the real
composition root (not the HTTP layer, which would require JWT fixtures):

    promote booking -> complete (Phase 25) -> sign-off (Phase 26)
    -> GET -> re-submit rejection -> waiting list -> DELETE

The test is self-cleaning: the fixture teardown restores the booking
status and removes any rows written to BOOKING_JOB_COMPLETIONS and
BOOKING_JOB_REVIEWS.
"""
from __future__ import annotations

from typing import Any

import pytest
from sqlalchemy import text

from app.bootstrap import Bootstrap
from app.shared.exceptions.hierarchy import AuthorizationError, ValidationError
from app.startup.composition import get_composition

_engine: Any = None
_comp: Any = None


@pytest.fixture(scope="session", autouse=True)
async def _ensure_composition():
    """Bootstrap the composition root once for the test session."""
    global _engine, _comp
    if _comp is None:
        boot = Bootstrap()
        await boot.run_startup()
        _comp = get_composition()
        _engine = _comp.sql_query_manager._databases.engine_for("PRIMARY_DB")
    yield
    # Dispose the engine while the session event loop is still alive.
    if _engine is not None:
        await _engine.dispose()


@pytest.fixture()
async def _booking():
    """Pick a real, untouched booking, yield its identifiers, then clean up."""
    if _comp is None:
        pytest.skip("Composition not bootstrapped")
    async with _engine.begin() as conn:
        q = await conn.execute(text("""
            SELECT b.booking_id, b.customer_id, b.provider_id, b.status
              FROM "BOOKINGS" b
             WHERE b.status IN ('PAYMENT_AUTHORIZED', 'SCHEDULED', 'SERVICE_ASSIGNED')
               AND b.provider_id IS NOT NULL
               AND b.booking_id NOT IN (SELECT booking_id FROM "BOOKING_JOB_COMPLETIONS")
               AND b.booking_id NOT IN (SELECT booking_id FROM "BOOKING_JOB_REVIEWS")
             ORDER BY b.created_at DESC
             LIMIT 1
        """))
        row = q.fetchone()
    if not row:
        pytest.skip("No suitable booking available in the database")
    bid, cid, pid, status_before = row
    yield {
        "booking_id": str(bid),
        "customer_id": str(cid),
        "provider_id": str(pid),
        "status_before": status_before,
    }
    async with _engine.begin() as conn:
        await conn.execute(
            text('DELETE FROM "BOOKING_JOB_REVIEWS" WHERE booking_id = :bid'),
            {"bid": bid},
        )
        await conn.execute(
            text('DELETE FROM "BOOKING_JOB_COMPLETIONS" WHERE booking_id = :bid'),
            {"bid": bid},
        )
        await conn.execute(
            text('UPDATE "BOOKINGS" SET status = :st, updated_at = now() '
                 'WHERE booking_id = :bid'),
            {"st": status_before, "bid": bid},
        )


@pytest.mark.asyncio
async def test_full_signoff_flow(_booking):
    """End-to-end Phase 25 -> 26 sign-off lifecycle."""
    bid = _booking["booking_id"]
    pid = _booking["provider_id"]

    async with _engine.begin() as conn:
        await conn.execute(text("""
            UPDATE "BOOKINGS" SET status = 'IN_PROGRESS', updated_at = now()
             WHERE booking_id = :bid AND provider_id = :pid
        """), {"bid": bid, "pid": pid})

    comp_svc = _comp.provider_job_completion_service()
    completed = await comp_svc.complete(
        provider_id=pid, booking_id=bid, completion_notes="Integration test job done",
    )
    assert completed["booking_status"] == "COMPLETION_REQUESTED", completed

    review_svc = _comp.provider_job_review_service()
    rec = await review_svc.submit(
        provider_id=pid, booking_id=bid, sign_off="DIGITAL_SIGNATURE",
        approval_evidence="Customer signed off via app + PIN 1234.",
    )
    assert rec["sign_off"] == "DIGITAL_SIGNATURE"
    assert rec["booking_status"] == "COMPLETION_REQUESTED"
    assert rec["review_id"]

    got = await review_svc.get(pid, bid)
    assert got is not None
    assert got["sign_off"] == "DIGITAL_SIGNATURE"
    assert got["approval_evidence"] == "Customer signed off via app + PIN 1234."

    with pytest.raises(AuthorizationError):
        await review_svc.submit(
            provider_id=pid, booking_id=bid, sign_off="DIGITAL_SIGNATURE",
            approval_evidence="Should fail",
        )

    waiting = await review_svc.waiting(pid)
    waiting_ids = [w["booking_id"] for w in waiting]
    assert bid not in waiting_ids

    deleted = await review_svc.delete(pid, rec["review_id"])
    assert deleted is not None
    assert deleted["booking_id"] == bid

    assert await review_svc.get(pid, bid) is None


@pytest.mark.asyncio
async def test_invalid_sign_off_kind_rejected(_booking):
    """An unknown sign_off kind raises ValidationError before touching the DB."""
    bid = _booking["booking_id"]
    pid = _booking["provider_id"]

    async with _engine.begin() as conn:
        await conn.execute(text("""
            UPDATE "BOOKINGS" SET status = 'IN_PROGRESS', updated_at = now()
             WHERE booking_id = :bid AND provider_id = :pid
        """), {"bid": bid, "pid": pid})

    comp_svc = _comp.provider_job_completion_service()
    await comp_svc.complete(provider_id=pid, booking_id=bid, completion_notes="Test")

    review_svc = _comp.provider_job_review_service()
    with pytest.raises(ValidationError):
        await review_svc.submit(
            provider_id=pid, booking_id=bid, sign_off="FAKE_METHOD",
            approval_evidence="nope",
        )
