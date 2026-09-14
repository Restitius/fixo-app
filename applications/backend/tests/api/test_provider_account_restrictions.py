"""Integration tests for Phase 53 - provider account restrictions & status.

Exercises the full registry-driven SQL adapter path through the real
composition root: no restriction initially -> impose -> status reflects
it -> history -> lift -> status clears -> re-lift rejected, plus
invalid-restriction-type rejection.

impose()/lift() are platform/admin-only service methods (mirroring
Disputes' "resolution stays platform-side" convention) with no
provider-facing endpoint, so this test calls the service directly
rather than through the router.

Self-cleaning: teardown deletes any restriction rows for the test
provider.
"""
from __future__ import annotations

from typing import Any

import pytest
from sqlalchemy import text

from app.bootstrap import Bootstrap
from app.shared.exceptions.hierarchy import ConflictError, ValidationError
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


@pytest.fixture(autouse=True)
async def _cleanup(_provider):
    yield
    async with _engine.begin() as conn:
        await conn.execute(
            text('DELETE FROM "PROVIDER_ACCOUNT_RESTRICTIONS" WHERE provider_id = :pid'),
            {"pid": _provider},
        )


@pytest.mark.asyncio
async def test_full_restriction_lifecycle(_provider):
    svc = _comp.provider_account_restrictions_service()

    initial = await svc.status_summary(_provider)
    assert initial["is_restricted"] is False

    imposed = await svc.impose(
        _provider, restriction_type="warning",
        reason="Late arrival reported by multiple customers",
    )
    assert imposed["restriction_type"] == "WARNING"
    assert imposed["status"] == "ACTIVE"
    rid = str(imposed["restriction_id"])

    after_impose = await svc.status_summary(_provider)
    assert after_impose["is_restricted"] is True
    assert len(after_impose["active_restrictions"]) == 1

    history = await svc.history(_provider)
    assert len(history) == 1

    lifted = await svc.lift(rid, lifted_reason="Provider completed a coaching session")
    assert lifted["status"] == "LIFTED"

    after_lift = await svc.status_summary(_provider)
    assert after_lift["is_restricted"] is False

    with pytest.raises(ConflictError):
        await svc.lift(rid, lifted_reason="again")


@pytest.mark.asyncio
async def test_invalid_restriction_type_rejected(_provider):
    svc = _comp.provider_account_restrictions_service()
    with pytest.raises(ValidationError):
        await svc.impose(_provider, restriction_type="bogus", reason="x")
