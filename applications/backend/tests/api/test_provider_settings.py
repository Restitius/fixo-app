"""Integration tests for Phase 50 - provider settings (preferences, security, privacy).

Exercises the full registry-driven SQL adapter path through the real
composition root against a synthetic provider (created directly with a
known password hash, since the service layer never returns a plaintext
password path). Covers: preferences upsert, password change (with
wrong-current-password rejection), session revocation (both the
no-active-sessions no-op and a real revoke), consent management, and
data export requests.

Self-cleaning: teardown deletes the synthetic provider (cascades to its
preferences/consents/exports/sessions via ON DELETE CASCADE).
"""
from __future__ import annotations

from typing import Any

import pytest
from sqlalchemy import text

from app.bootstrap import Bootstrap
from app.shared.exceptions.hierarchy import AuthenticationError, ValidationError
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
    email = "settings-test-pytest@example.com"
    async with _engine.begin() as conn:
        await conn.execute(text('DELETE FROM "PROVIDERS" WHERE email = :e'), {"e": email})
        row = (await conn.execute(text("""
            INSERT INTO "PROVIDERS" (display_name, email, phone, password_hash, account_type, status)
            VALUES (:n, :e, :p, :h, 'INDIVIDUAL', 'ACTIVE') RETURNING provider_id
        """), {
            "n": "Settings Test", "e": email, "p": "+255700123199",
            "h": hasher.hash("OldPass123"),
        })).first()
    pid = str(row[0])
    yield pid
    async with _engine.begin() as conn:
        await conn.execute(text('DELETE FROM "PROVIDERS" WHERE provider_id = :pid'), {"pid": pid})


@pytest.mark.asyncio
async def test_preferences(_provider):
    svc = _comp.provider_preference_service()
    saved = await svc.set(_provider, "sms_notifications", "true")
    assert saved["key"] == "sms_notifications"
    listed = await svc.list(_provider)
    assert any(p["key"] == "sms_notifications" and p["value"] == "true" for p in listed)


@pytest.mark.asyncio
async def test_security_password_and_sessions(_provider):
    svc = _comp.provider_security_service()

    changed = await svc.change_password(_provider, "OldPass123", "NewPass456")
    assert changed is True

    with pytest.raises(AuthenticationError):
        await svc.change_password(_provider, "WrongPass", "AnotherPass789")

    # No active sessions yet: revoke is a successful no-op.
    result = await svc.revoke_all_sessions(_provider)
    assert result == {"revoked": True}

    async with _engine.begin() as conn:
        await conn.execute(text("""
            INSERT INTO "PROVIDER_AUTH_SESSIONS" (provider_id, refresh_token_hash, expires_at)
            VALUES (:pid, 'fakehash123', now() + interval '1 day')
        """), {"pid": _provider})

    await svc.revoke_all_sessions(_provider)
    async with _engine.begin() as conn:
        active = (await conn.execute(text(
            'SELECT COUNT(*) FROM "PROVIDER_AUTH_SESSIONS" WHERE provider_id = :pid AND revoked_at IS NULL'
        ), {"pid": _provider})).scalar()
    assert active == 0


@pytest.mark.asyncio
async def test_privacy_consents_and_exports(_provider):
    svc = _comp.provider_privacy_service()

    consent = await svc.set_consent(_provider, "marketing", True)
    assert consent["kind"] == "MARKETING"
    assert consent["consented"] is True

    consents = await svc.list_consents(_provider)
    assert any(c["kind"] == "MARKETING" for c in consents)

    with pytest.raises(ValidationError):
        await svc.set_consent(_provider, "bogus_kind", True)

    export = await svc.request_export(_provider)
    assert export["status"] == "PENDING"

    exports = await svc.list_exports(_provider)
    assert any(e["request_id"] == export["request_id"] for e in exports)
