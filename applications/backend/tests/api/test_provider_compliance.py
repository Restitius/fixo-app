"""Integration tests for Phase 47 - provider documents & compliance (expiry).

Extends the existing Phase 5 verification system (same
PROVIDER_VERIFICATION_DOCUMENTS table) with a compliance-monitoring
view: verified documents nearing or past expiry.

Self-cleaning: teardown deletes the synthetic document rows this test
inserts directly (there is no service-level "add a VERIFIED document"
path — verification requires platform review — so the fixture seeds
rows straight into the table, matching a document a reviewer has
already approved).
"""
from __future__ import annotations

import uuid
from typing import Any

import pytest
from sqlalchemy import text

from app.bootstrap import Bootstrap
from app.shared.exceptions.hierarchy import ValidationError
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
        # Pick a provider with none of these three doc types active yet, so the
        # test's inserts can't collide with UX_PROVIDER_VER_DOCS_ACTIVE.
        row = (await conn.execute(text("""
            SELECT p.provider_id FROM "PROVIDERS" p
            WHERE NOT EXISTS (
                SELECT 1 FROM "PROVIDER_VERIFICATION_DOCUMENTS" d
                WHERE d.provider_id = p.provider_id
                  AND d.deleted_at IS NULL
                  AND d.doc_type IN ('NATIONAL_ID', 'PASSPORT', 'DRIVING_LICENCE')
            )
            LIMIT 1
        """))).first()
    if row is None:
        pytest.skip("Need a provider with no active NATIONAL_ID/PASSPORT/DRIVING_LICENCE documents")
    yield str(row[0])


@pytest.fixture()
async def _cleanup_docs():
    created: list[str] = []
    yield created
    if created:
        async with _engine.begin() as conn:
            for did in created:
                await conn.execute(
                    text('DELETE FROM "PROVIDER_VERIFICATION_DOCUMENTS" WHERE doc_id = :did'),
                    {"did": did},
                )


@pytest.mark.asyncio
async def test_expiring_and_expired_documents_surface(_provider, _cleanup_docs):
    pid = _provider
    svc = _comp.provider_verification_service()

    expiring_soon_id = str(uuid.uuid4())
    already_expired_id = str(uuid.uuid4())
    far_future_id = str(uuid.uuid4())
    async with _engine.begin() as conn:
        await conn.execute(text("""
            INSERT INTO "PROVIDER_VERIFICATION_DOCUMENTS"
            (doc_id, provider_id, doc_type, front_image_url, expiry_date, status)
            VALUES
            (:a, :pid, 'NATIONAL_ID', 'http://example.com/a.jpg', CURRENT_DATE + 10, 'VERIFIED'),
            (:b, :pid, 'PASSPORT', 'http://example.com/b.jpg', CURRENT_DATE - 5, 'VERIFIED'),
            (:c, :pid, 'DRIVING_LICENCE', 'http://example.com/c.jpg', CURRENT_DATE + 300, 'VERIFIED')
        """), {"a": expiring_soon_id, "b": already_expired_id, "c": far_future_id, "pid": pid})
    _cleanup_docs.extend([expiring_soon_id, already_expired_id, far_future_id])

    within_30 = await svc.expiring_documents(pid, within_days=30)
    ids = {d["doc_id"] for d in within_30}
    assert expiring_soon_id in ids
    assert already_expired_id in ids
    assert far_future_id not in ids

    expired_row = next(d for d in within_30 if d["doc_id"] == already_expired_id)
    assert expired_row["is_expired"] is True
    soon_row = next(d for d in within_30 if d["doc_id"] == expiring_soon_id)
    assert soon_row["is_expired"] is False

    with pytest.raises(ValidationError):
        await svc.expiring_documents(pid, within_days=0)
    with pytest.raises(ValidationError):
        await svc.expiring_documents(pid, within_days=400)
