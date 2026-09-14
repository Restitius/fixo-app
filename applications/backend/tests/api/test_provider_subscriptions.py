"""Integration tests for Phase 52 - provider subscription / plans.

Exercises the full registry-driven SQL adapter path through the real
composition root: no active subscription initially -> subscribe ->
switch plans (atomically cancelling the old one) -> history -> an
invalid plan_id leaves the current subscription untouched (the
subscribe query's cancel step is gated on the target plan being valid)
-> cancel -> re-cancel rejected.

Self-cleaning: teardown deletes any subscription rows for the test
provider.
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
async def _provider_and_plans():
    if _comp is None:
        pytest.skip("Composition not bootstrapped")
    async with _engine.begin() as conn:
        prow = (await conn.execute(text('SELECT provider_id FROM "PROVIDERS" LIMIT 1'))).first()
        basic = (await conn.execute(text('SELECT plan_id FROM "PROVIDER_PLANS" WHERE code = \'BASIC\''))).first()
        pro = (await conn.execute(text('SELECT plan_id FROM "PROVIDER_PLANS" WHERE code = \'PRO\''))).first()
    if prow is None or basic is None or pro is None:
        pytest.skip("Need a provider and BASIC/PRO plans in the database")
    yield {"provider_id": str(prow[0]), "basic_id": str(basic[0]), "pro_id": str(pro[0])}


@pytest.fixture(autouse=True)
async def _cleanup(_provider_and_plans):
    yield
    async with _engine.begin() as conn:
        await conn.execute(
            text('DELETE FROM "PROVIDER_SUBSCRIPTIONS" WHERE provider_id = :pid'),
            {"pid": _provider_and_plans["provider_id"]},
        )


@pytest.mark.asyncio
async def test_full_subscription_lifecycle(_provider_and_plans):
    pid = _provider_and_plans["provider_id"]
    basic_id = _provider_and_plans["basic_id"]
    pro_id = _provider_and_plans["pro_id"]
    svc = _comp.provider_subscriptions_service()

    plans = await svc.list_plans()
    assert len(plans) >= 2

    with pytest.raises(NotFoundError):
        await svc.current(pid)

    subscribed = await svc.subscribe(pid, plan_id=basic_id)
    assert subscribed["plan_id"] == basic_id
    assert subscribed["status"] == "ACTIVE"

    switched = await svc.subscribe(pid, plan_id=pro_id)
    assert switched["plan_id"] == pro_id

    current = await svc.current(pid)
    assert current["plan_code"] == "PRO"

    history = await svc.history(pid)
    assert len(history) == 2
    statuses = {h["plan_code"]: h["status"] for h in history}
    assert statuses["PRO"] == "ACTIVE"
    assert statuses["BASIC"] == "CANCELLED"

    with pytest.raises(NotFoundError):
        await svc.subscribe(pid, plan_id="00000000-0000-0000-0000-000000000000")

    # Atomicity: the failed switch must not have cancelled the current plan.
    still_current = await svc.current(pid)
    assert still_current["plan_code"] == "PRO"

    cancelled = await svc.cancel(pid)
    assert cancelled["status"] == "CANCELLED"

    with pytest.raises(ConflictError):
        await svc.cancel(pid)
