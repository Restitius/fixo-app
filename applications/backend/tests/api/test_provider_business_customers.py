"""Integration tests for Phase 43 - provider business customers & negotiated rates.

Exercises the full registry-driven SQL adapter path through the real
composition root: create -> list -> get -> update -> deactivate ->
re-deactivate rejected, plus duplicate-registration and invalid-rate
rejection.

Self-cleaning: the fixture teardown deletes any row written to
PROVIDER_BUSINESS_CUSTOMERS.
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
async def _pair():
    if _comp is None:
        pytest.skip("Composition not bootstrapped")
    async with _engine.begin() as conn:
        prow = (await conn.execute(text('SELECT provider_id FROM "PROVIDERS" LIMIT 1'))).first()
        crow = (await conn.execute(text('SELECT customer_id FROM "CUSTOMERS" LIMIT 1'))).first()
    if prow is None or crow is None:
        pytest.skip("Need at least one provider and one customer in the database")
    yield {"provider_id": str(prow[0]), "customer_id": str(crow[0])}


@pytest.fixture()
async def _cleanup_records():
    created: list[str] = []
    yield created
    if created:
        async with _engine.begin() as conn:
            for rid in created:
                await conn.execute(
                    text('DELETE FROM "PROVIDER_BUSINESS_CUSTOMERS" WHERE record_id = :rid'),
                    {"rid": rid},
                )


@pytest.mark.asyncio
async def test_full_business_customer_flow(_pair, _cleanup_records):
    pid, cid = _pair["provider_id"], _pair["customer_id"]
    svc = _comp.provider_business_customers_service()

    record = await svc.create(
        pid, customer_id=cid, company_name="Acme Corp",
        negotiated_rate_type="percent_discount", negotiated_rate_value=15, notes="Quarterly contract",
    )
    _cleanup_records.append(str(record["record_id"]))
    assert record["negotiated_rate_type"] == "PERCENT_DISCOUNT"
    assert record["status"] == "ACTIVE"
    rid = str(record["record_id"])

    listed = await svc.list_customers(pid)
    assert any(r["record_id"] == record["record_id"] for r in listed)

    got = await svc.get(pid, record_id=rid)
    assert got["negotiated_rate_value"] == 15

    updated = await svc.update(pid, record_id=rid, negotiated_rate_value=20)
    assert updated["negotiated_rate_value"] == 20

    with pytest.raises(ValidationError):
        await svc.update(pid, record_id=rid, negotiated_rate_type="PERCENT_DISCOUNT", negotiated_rate_value=150)

    deactivated = await svc.deactivate(pid, record_id=rid)
    assert deactivated["status"] == "INACTIVE"

    with pytest.raises(ConflictError):
        await svc.deactivate(pid, record_id=rid)


@pytest.mark.asyncio
async def test_duplicate_registration_rejected(_pair, _cleanup_records):
    pid, cid = _pair["provider_id"], _pair["customer_id"]
    svc = _comp.provider_business_customers_service()

    record = await svc.create(
        pid, customer_id=cid, company_name=None,
        negotiated_rate_type="FIXED_RATE", negotiated_rate_value=50, notes=None,
    )
    _cleanup_records.append(str(record["record_id"]))

    with pytest.raises(ConflictError):
        await svc.create(
            pid, customer_id=cid, company_name=None,
            negotiated_rate_type="FIXED_RATE", negotiated_rate_value=75, notes=None,
        )
