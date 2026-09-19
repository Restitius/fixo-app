"""Integration tests for Phase 48 - provider promotions.

Exercises the full registry-driven SQL adapter path through the real
composition root: create -> list -> get -> validate -> redeem ->
deactivate -> validate-after-deactivate rejected, plus duplicate-code
rejection, invalid-terms rejection, and cross-provider ownership
isolation.

Self-cleaning: teardown deletes any row written to PROVIDER_PROMOTIONS.
"""
from __future__ import annotations

import datetime
from typing import Any

import pytest
from sqlalchemy import text

from app.bootstrap import Bootstrap
from app.shared.exceptions.hierarchy import ConflictError, NotFoundError, ValidationError
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
async def _cleanup_promos():
    created: list[str] = []
    yield created
    if created:
        async with _engine.begin() as conn:
            for pmid in created:
                await conn.execute(
                    text('DELETE FROM "PROVIDER_PROMOTIONS" WHERE promo_id = :pmid'), {"pmid": pmid}
                )


@pytest.mark.asyncio
async def test_full_promotion_flow(_providers, _cleanup_promos):
    pid, other_pid = _providers["provider_id"], _providers["other_provider_id"]
    svc = _comp.provider_promotions_service()
    now = datetime.datetime.now(datetime.UTC)

    promo = await svc.create(
        pid, code="welcome10", name="Welcome Discount", description="New customer discount",
        discount_type="percent", discount_value=10, min_amount=50, max_discount=20, usage_limit=5,
        valid_from=now - datetime.timedelta(days=1), valid_until=now + datetime.timedelta(days=30),
    )
    _cleanup_promos.append(str(promo["promo_id"]))
    assert promo["code"] == "WELCOME10"
    assert promo["active"] is True
    pmid = str(promo["promo_id"])

    listed = await svc.list_promotions(pid)
    assert any(p["promo_id"] == promo["promo_id"] for p in listed)

    got = await svc.get(pid, promo_id=pmid)
    assert got["code"] == "WELCOME10"

    validated = await svc.validate_code(pid, code="welcome10", amount=100)
    assert validated["discount_amount"] == 10.0

    redeemed = await svc.redeem(pid, promo_id=pmid)
    assert redeemed["used_count"] == 1

    with pytest.raises(ConflictError):
        await svc.create(
            pid, code="WELCOME10", name="dup", description=None, discount_type="FIXED_AMOUNT",
            discount_value=5, min_amount=0, max_discount=None, usage_limit=None,
            valid_from=now, valid_until=now + datetime.timedelta(days=10),
        )

    with pytest.raises(NotFoundError):
        await svc.get(other_pid, promo_id=pmid)

    deactivated = await svc.deactivate(pid, promo_id=pmid)
    assert deactivated["active"] is False

    with pytest.raises(NotFoundError):
        await svc.validate_code(pid, code="WELCOME10", amount=100)

    with pytest.raises(ConflictError):
        await svc.deactivate(pid, promo_id=pmid)


@pytest.mark.asyncio
async def test_invalid_terms_rejected(_providers):
    pid = _providers["provider_id"]
    svc = _comp.provider_promotions_service()
    now = datetime.datetime.now(datetime.UTC)

    with pytest.raises(ValidationError):
        await svc.create(
            pid, code="BADPCT", name="Bad", description=None, discount_type="PERCENT",
            discount_value=150, min_amount=0, max_discount=None, usage_limit=None,
            valid_from=now, valid_until=now + datetime.timedelta(days=10),
        )

    with pytest.raises(ValidationError):
        await svc.create(
            pid, code="BADDATES", name="Bad", description=None, discount_type="FIXED_AMOUNT",
            discount_value=5, min_amount=0, max_discount=None, usage_limit=None,
            valid_from=now, valid_until=now - datetime.timedelta(days=1),
        )
