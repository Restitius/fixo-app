"""Webhook signature verification — the real Swala SMS callback endpoint.

Webhooks are an unauthenticated public endpoint that changes booking and
notification-delivery state. They deserve the most hostile tests in the
suite.

Writing this test suite found a real, live bug: request.app.state is a
genuine Starlette State object (attribute access only, no dict .get()),
but the endpoint did `getattr(request.app, "state", {}).get(...)` —
which raised AttributeError unconditionally, crashing every single call
to this endpoint regardless of signature validity. Nothing set
app.state.swala_sms_webhook_secret at startup either, so even a fixed
lookup would have found nothing. Both are fixed in this same change
(app/startup/application.py sets the state attribute; the router reads
it via getattr on the State object, not .get()) — this endpoint has
been unreachable since it was written earlier this session, and the
webhook-reconciliation logic behind it has never actually run.

The real .env value for SWALA_SMS_WEBHOOK_SECRET is blank in this dev
environment, so these tests set a known test secret via monkeypatch
directly on the app's state, exactly as the handbook's own example uses
a hardcoded test-only secret rather than depending on real configuration.
"""
from __future__ import annotations

import hashlib
import hmac
import json
import time

import pytest

from app.main import app

SECRET = "test-only-webhook-secret"
PATH = "/api/v1/webhooks/integrations/swala/sms"


def sign(body: bytes, secret: str = SECRET) -> str:
    return hmac.new(secret.encode(), body, hashlib.sha256).hexdigest()


def body_for(event: str = "sms.delivered", message_id: str = "9f2c1e3a-4b7d-4e2b-9c3e-2f6a7d8b1c4e") -> bytes:
    return json.dumps({"event": event, "message_id": message_id, "timestamp": int(time.time())}).encode()


@pytest.fixture(autouse=True)
def _webhook_secret(monkeypatch):
    monkeypatch.setattr(app.state, "swala_sms_webhook_secret", SECRET, raising=False)


async def test_valid_signature_is_accepted(client):
    body = body_for()
    r = await client.post(PATH, content=body, headers={"X-SwalaSMS-Signature": sign(body)})
    assert r.status_code == 200


async def test_missing_signature_is_rejected(client):
    r = await client.post(PATH, content=body_for())
    assert r.status_code in (400, 401)


async def test_wrong_secret_is_rejected(client):
    body = body_for()
    r = await client.post(PATH, content=body, headers={"X-SwalaSMS-Signature": sign(body, "wrong-secret")})
    assert r.status_code in (400, 401)


async def test_tampered_body_is_rejected(client):
    body = body_for(event="sms.delivered")
    signature = sign(body)
    tampered = body.replace(b"delivered", b"failed_x")  # keep byte length identical
    r = await client.post(PATH, content=tampered, headers={"X-SwalaSMS-Signature": signature})
    assert r.status_code in (400, 401)


async def test_replay_is_a_safe_no_op_not_duplicated(client):
    """WEBHOOK_RECEIPTS is unique on (provider, message_id, event) — a
    replayed callback must be accepted idempotently, not double-processed."""
    body = body_for(message_id="replay-test-message-id")
    headers = {"X-SwalaSMS-Signature": sign(body)}
    first = await client.post(PATH, content=body, headers=headers)
    second = await client.post(PATH, content=body, headers=headers)
    assert first.status_code == 200
    assert second.status_code == 200
    assert second.json().get("duplicate") is True


async def test_malformed_payload_does_not_500(client):
    body = b"{not json"
    r = await client.post(PATH, content=body, headers={"X-SwalaSMS-Signature": sign(body)})
    assert r.status_code < 500


async def test_missing_secret_is_reported_not_silently_accepted(client, monkeypatch):
    monkeypatch.setattr(app.state, "swala_sms_webhook_secret", "", raising=False)
    body = body_for()
    r = await client.post(PATH, content=body, headers={"X-SwalaSMS-Signature": sign(body)})
    assert r.status_code == 400
    assert r.json()["error"]["code"] == "INTEGRATION.SWALA_WEBHOOK_SECRET_MISSING"
