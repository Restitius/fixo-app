"""Integration tests for Phase 46 - provider equipment & tools registry.

Exercises the full registry-driven SQL adapter path through the real
composition root: create -> list -> get -> assign to a team member ->
update -> release -> retire -> re-retire rejected, plus assigning
retired equipment rejected and cross-provider ownership isolation.

Self-cleaning: teardown deletes any rows written to PROVIDER_EQUIPMENT
and PROVIDER_TEAM_MEMBERS.
"""
from __future__ import annotations

import datetime
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
async def _cleanup():
    created: dict[str, list[str]] = {"equipment": [], "members": []}
    yield created
    async with _engine.begin() as conn:
        for eid in created["equipment"]:
            await conn.execute(text('DELETE FROM "PROVIDER_EQUIPMENT" WHERE equipment_id = :eid'), {"eid": eid})
        for mid in created["members"]:
            await conn.execute(text('DELETE FROM "PROVIDER_TEAM_MEMBERS" WHERE member_id = :mid'), {"mid": mid})


@pytest.mark.asyncio
async def test_full_equipment_lifecycle(_providers, _cleanup):
    pid, other_pid = _providers["provider_id"], _providers["other_provider_id"]
    team_svc = _comp.provider_team_service()
    svc = _comp.provider_equipment_service()

    member = await team_svc.create_member(
        pid, full_name="Tool Tech", phone="+255700999000", email=None, role="TECHNICIAN", notes=None,
    )
    _cleanup["members"].append(str(member["member_id"]))
    mid = str(member["member_id"])

    equipment = await svc.create(
        pid, name="Cordless Drill", category="power_tool", serial_number="SN-1001",
        condition="good", purchase_date=datetime.date(2025, 1, 15), notes="Bought new",
    )
    _cleanup["equipment"].append(str(equipment["equipment_id"]))
    assert equipment["status"] == "AVAILABLE"
    eid = str(equipment["equipment_id"])

    listed = await svc.list_equipment(pid)
    assert any(e["equipment_id"] == equipment["equipment_id"] for e in listed)

    assigned = await svc.assign(pid, equipment_id=eid, member_id=mid)
    assert assigned["status"] == "IN_USE"
    assert assigned["assigned_member_id"] == mid

    updated = await svc.update(pid, equipment_id=eid, condition="fair", notes="Slight wear")
    assert updated["condition"] == "FAIR"

    with pytest.raises(NotFoundError):
        await svc.get(other_pid, equipment_id=eid)

    released = await svc.assign(pid, equipment_id=eid, member_id=None)
    assert released["status"] == "AVAILABLE"
    assert released["assigned_member_id"] is None

    retired = await svc.retire(pid, equipment_id=eid)
    assert retired["status"] == "RETIRED"

    with pytest.raises(ConflictError):
        await svc.assign(pid, equipment_id=eid, member_id=mid)

    with pytest.raises(ConflictError):
        await svc.retire(pid, equipment_id=eid)
