"""Integration tests for Phase 45 - provider job assignment (dispatch/technician).

Exercises the full registry-driven SQL adapter path through the real
composition root: create (with a freshly-created team member) -> list ->
get -> update status -> cancel -> re-cancel rejected, plus duplicate-
booking-assignment rejection and cross-provider ownership isolation.

Self-cleaning: teardown deletes any rows written to
PROVIDER_JOB_ASSIGNMENTS and PROVIDER_TEAM_MEMBERS.
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
async def _booking_and_providers():
    if _comp is None:
        pytest.skip("Composition not bootstrapped")
    async with _engine.begin() as conn:
        brow = (await conn.execute(text('SELECT booking_id, provider_id FROM "BOOKINGS" LIMIT 1'))).first()
        if brow is None:
            pytest.skip("Need at least one booking in the database")
        orow = (await conn.execute(
            text('SELECT provider_id FROM "PROVIDERS" WHERE provider_id != :pid LIMIT 1'),
            {"pid": str(brow[1])},
        )).first()
    if orow is None:
        pytest.skip("Need a second provider in the database")
    yield {"booking_id": str(brow[0]), "provider_id": str(brow[1]), "other_provider_id": str(orow[0])}


@pytest.fixture()
async def _cleanup():
    created: dict[str, list[str]] = {"assignments": [], "members": []}
    yield created
    async with _engine.begin() as conn:
        for aid in created["assignments"]:
            await conn.execute(
                text('DELETE FROM "PROVIDER_JOB_ASSIGNMENTS" WHERE assignment_id = :aid'), {"aid": aid}
            )
        for mid in created["members"]:
            await conn.execute(
                text('DELETE FROM "PROVIDER_TEAM_MEMBERS" WHERE member_id = :mid'), {"mid": mid}
            )


@pytest.mark.asyncio
async def test_full_assignment_flow(_booking_and_providers, _cleanup):
    pid, bid = _booking_and_providers["provider_id"], _booking_and_providers["booking_id"]
    team_svc = _comp.provider_team_service()
    svc = _comp.provider_job_assignments_service()

    member = await team_svc.create_member(
        pid, full_name="Asha Njoroge", phone="+255700555666", email=None, role="TECHNICIAN", notes=None,
    )
    _cleanup["members"].append(str(member["member_id"]))
    mid = str(member["member_id"])

    assignment = await svc.create(pid, booking_id=bid, member_id=mid, notes="First job of the day")
    _cleanup["assignments"].append(str(assignment["assignment_id"]))
    assert assignment["status"] == "ASSIGNED"
    aid = str(assignment["assignment_id"])

    listed = await svc.list_assignments(pid)
    assert any(a["assignment_id"] == assignment["assignment_id"] for a in listed)

    got = await svc.get(pid, assignment_id=aid)
    assert got["member_name"] == "Asha Njoroge"

    updated = await svc.update(pid, assignment_id=aid, status="acknowledged")
    assert updated["status"] == "ACKNOWLEDGED"

    with pytest.raises(ConflictError):
        await svc.create(pid, booking_id=bid, member_id=mid, notes="duplicate")

    cancelled = await svc.cancel(pid, assignment_id=aid)
    assert cancelled["status"] == "CANCELLED"

    with pytest.raises(ConflictError):
        await svc.cancel(pid, assignment_id=aid)


@pytest.mark.asyncio
async def test_cross_provider_booking_rejected(_booking_and_providers, _cleanup):
    other_pid, bid = _booking_and_providers["other_provider_id"], _booking_and_providers["booking_id"]
    team_svc = _comp.provider_team_service()
    svc = _comp.provider_job_assignments_service()

    member = await team_svc.create_member(
        other_pid, full_name="Foreign Worker", phone="+255700777888", email=None, role="TECHNICIAN", notes=None,
    )
    _cleanup["members"].append(str(member["member_id"]))

    with pytest.raises(NotFoundError):
        await svc.create(other_pid, booking_id=bid, member_id=str(member["member_id"]), notes=None)
