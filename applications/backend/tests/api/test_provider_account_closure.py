"""Integration tests for Phase 54 - provider account closure.

Mirrors the customer-side account closure flow. Exercises the full
registry-driven SP call through the real composition root against a
synthetic provider: scheduling closure marks the provider row
deleted_at/is_deleted and records a PROVIDER_ACCOUNT_CLOSURES entry.

Self-cleaning: teardown deletes the synthetic provider (cascades to its
closure record via ON DELETE CASCADE).
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
    email = "closure-test-pytest@example.com"
    async with _engine.begin() as conn:
        await conn.execute(text('DELETE FROM "PROVIDERS" WHERE email = :e'), {"e": email})
        row = (await conn.execute(text("""
            INSERT INTO "PROVIDERS" (display_name, email, phone, password_hash, account_type, status)
            VALUES (:n, :e, :p, :h, 'INDIVIDUAL', 'ACTIVE') RETURNING provider_id
        """), {
            "n": "Closure Test", "e": email, "p": "+255700888988",
            "h": hasher.hash("Pass12345"),
        })).first()
    pid = str(row[0])
    yield pid
    async with _engine.begin() as conn:
        await conn.execute(text('DELETE FROM "PROVIDERS" WHERE provider_id = :pid'), {"pid": pid})


@pytest.mark.asyncio
async def test_schedule_closure(_provider):
    svc = _comp.provider_account_closure_service()

    result = await svc.schedule_closure(_provider)
    assert result["closed"] is True
    assert result["reversible"] is True

    async with _engine.begin() as conn:
        prow = (await conn.execute(
            text('SELECT deleted_at, is_deleted FROM "PROVIDERS" WHERE provider_id = :pid'),
            {"pid": _provider},
        )).first()
        crow = (await conn.execute(
            text('SELECT reason FROM "PROVIDER_ACCOUNT_CLOSURES" WHERE provider_id = :pid'),
            {"pid": _provider},
        )).first()

    assert prow.deleted_at is not None
    assert prow.is_deleted is True
    assert crow.reason == "provider_requested"
