"""Integration tests for Phase 51 - provider activity & audit history.

Exercises the full registry-driven SQL adapter path through the real
composition root against a synthetic provider: a direct record() call
with JSON metadata round-trips correctly (a raw Python dict cannot be
bound to a JSONB column directly — this is exactly the class of bug
this service guards against by serializing before it reaches SQL), and
the security-sensitive actions from Phase 50 (password change, session
revocation) auto-log without any extra caller effort.

Self-cleaning: teardown deletes the synthetic provider (cascades to its
activity log rows via ON DELETE CASCADE).
"""
from __future__ import annotations

from typing import Any

import pytest
from sqlalchemy import text

from app.bootstrap import Bootstrap
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
    hasher = _comp._hasher
    email = "activity-test-pytest@example.com"
    async with _engine.begin() as conn:
        await conn.execute(text('DELETE FROM "PROVIDERS" WHERE email = :e'), {"e": email})
        row = (await conn.execute(text("""
            INSERT INTO "PROVIDERS" (display_name, email, phone, password_hash, account_type, status)
            VALUES (:n, :e, :p, :h, 'INDIVIDUAL', 'ACTIVE') RETURNING provider_id
        """), {
            "n": "Activity Test", "e": email, "p": "+255700456499",
            "h": hasher.hash("OldPass123"),
        })).first()
    pid = str(row[0])
    yield pid
    async with _engine.begin() as conn:
        await conn.execute(text('DELETE FROM "PROVIDERS" WHERE provider_id = :pid'), {"pid": pid})


@pytest.mark.asyncio
async def test_record_with_metadata_round_trips(_provider):
    svc = _comp.provider_activity_log_service()
    entry = await svc.record(
        _provider, action="TEAM.MEMBER_ADDED", entity_type="team_member",
        metadata={"name": "Jane Doe", "role": "TECHNICIAN"},
    )
    assert entry["action"] == "TEAM.MEMBER_ADDED"
    assert entry["metadata"] == {"name": "Jane Doe", "role": "TECHNICIAN"}

    entries = await svc.list_entries(_provider)
    assert any(e["log_id"] == entry["log_id"] for e in entries)


@pytest.mark.asyncio
async def test_security_actions_auto_log(_provider):
    sec_svc = _comp.provider_security_service()
    log_svc = _comp.provider_activity_log_service()

    await sec_svc.change_password(_provider, "OldPass123", "NewPass456")
    await sec_svc.revoke_all_sessions(_provider)

    entries = await log_svc.list_entries(_provider)
    actions = {e["action"] for e in entries}
    assert "SECURITY.PASSWORD_CHANGED" in actions
    assert "SECURITY.SESSIONS_REVOKED" in actions

    security_only = await log_svc.list_entries(_provider, action_prefix="SECURITY.")
    assert len(security_only) == 2
    assert all(e["action"].startswith("SECURITY.") for e in security_only)
