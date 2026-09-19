"""Integration tests for Phase 44 - provider team management (workers/roles).

Exercises the full registry-driven SQL adapter path through the real
composition root: create -> list -> get -> update -> deactivate ->
re-deactivate rejected, plus duplicate-phone rejection and cross-provider
ownership isolation.

Self-cleaning: the fixture teardown deletes any row written to
PROVIDER_TEAM_MEMBERS.
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
    if len(rows) < 2:
        pytest.skip("Need at least two providers in the database")
    yield {"provider_id": str(rows[0][0]), "other_provider_id": str(rows[1][0])}


@pytest.fixture()
async def _cleanup_members():
    created: list[str] = []
    yield created
    if created:
        async with _engine.begin() as conn:
            for mid in created:
                await conn.execute(
                    text('DELETE FROM "PROVIDER_TEAM_MEMBERS" WHERE member_id = :mid'),
                    {"mid": mid},
                )


@pytest.mark.asyncio
async def test_full_team_member_flow(_providers, _cleanup_members):
    pid, other_pid = _providers["provider_id"], _providers["other_provider_id"]
    svc = _comp.provider_team_service()

    member = await svc.create_member(
        pid, full_name="John Mwangi", phone="+255700111222", email=None,
        role="technician", notes="Certified electrician",
    )
    _cleanup_members.append(str(member["member_id"]))
    assert member["role"] == "TECHNICIAN"
    assert member["status"] == "ACTIVE"
    mid = str(member["member_id"])

    members = await svc.list_members(pid)
    assert any(m["member_id"] == member["member_id"] for m in members)

    got = await svc.get_member(pid, member_id=mid)
    assert got["full_name"] == "John Mwangi"

    updated = await svc.update_member(pid, member_id=mid, role="MANAGER")
    assert updated["role"] == "MANAGER"

    with pytest.raises(NotFoundError):
        await svc.get_member(other_pid, member_id=mid)

    deactivated = await svc.deactivate_member(pid, member_id=mid)
    assert deactivated["status"] == "INACTIVE"

    with pytest.raises(ConflictError):
        await svc.deactivate_member(pid, member_id=mid)


@pytest.mark.asyncio
async def test_duplicate_phone_rejected(_providers, _cleanup_members):
    pid = _providers["provider_id"]
    svc = _comp.provider_team_service()

    member = await svc.create_member(
        pid, full_name="Jane Doe", phone="+255700333444", email=None, role="OTHER", notes=None,
    )
    _cleanup_members.append(str(member["member_id"]))

    with pytest.raises(ConflictError):
        await svc.create_member(
            pid, full_name="Someone Else", phone="+255700333444", email=None, role="OTHER", notes=None,
        )
