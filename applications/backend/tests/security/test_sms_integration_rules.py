"""SwalaSMS integration rules — encodes the operational rules that this
session's own work on this integration depends on staying true, tested
against the REAL SwalaSmsProvider directly (unit-style — no network call
reaches these code paths since each one is rejected before any HTTP
request is made).

Two things the handbook's generic version assumes that FIXO-APP's real
implementation does NOT do, corrected here:
  - It does not normalise phone numbers to E.164 — it validates the
    caller already supplied E.164 and rejects anything else
    (E164_RE in app/integrations/external/providers/sms/swala.py).
  - It does not retry internally — retry/backoff happens one layer up,
    in NotificationManager._deliver_channel using app/jobs/retry.py's
    RetryPolicy, not inside the provider. There is nothing to test here
    for "429/5xx retry" without exercising that higher layer, which the
    notification-catalogue test suite (not this one) is the right place
    for.
"""

from __future__ import annotations

from typing import cast

import pytest

from app.integrations.external.clients.http_client import HttpClient
from app.integrations.external.exceptions.integration_errors import ProviderRejectedError
from app.integrations.external.providers.sms.swala import SwalaSmsProvider
from app.registries.integrations.integration_definition import IntegrationDefinition


def _provider() -> SwalaSmsProvider:
    definition = IntegrationDefinition(
        integration_id="INT.SMS.TRANSACTIONAL.V1",
        provider="swala",
        category="sms",
        credentials_key="SWALA_SMS",
    )
    return SwalaSmsProvider(definition)


@pytest.fixture(autouse=True)
def _fake_key(monkeypatch):
    monkeypatch.setenv("SWALA_SMS_API_KEY", "swl_test_XXXXXXXXXXXXXXXX")
    monkeypatch.setenv("SWALA_SMS_SENDER_ID", "FIXO")


async def test_non_e164_recipient_is_rejected_before_any_network_call(monkeypatch):
    provider = _provider()

    async def _fail_if_called(*args, **kwargs):
        raise AssertionError("no HTTP call should be made for an invalid recipient")

    monkeypatch.setattr(provider, "_client", lambda **_: type("C", (), {"request": _fail_if_called})())

    with pytest.raises(ProviderRejectedError, match="Invalid recipient"):
        await provider.send_sms(to="0712 345 678", text="Test", notification_id="ntf-1")


async def test_empty_body_is_rejected(monkeypatch):
    provider = _provider()
    monkeypatch.setattr(provider, "_client", lambda **_: type("C", (), {})())
    with pytest.raises(ProviderRejectedError, match="must not be empty"):
        await provider.send_sms(to="+255712345678", text="", notification_id="ntf-1")


async def test_idempotency_key_requires_notification_id_or_reference():
    """The phone-number-only fallback was removed this session — two
    distinct notifications to the same number must never collide on the
    same idempotency key. A caller that supplies neither is now a loud,
    fixable error, not a weak key."""
    provider = _provider()
    with pytest.raises(ProviderRejectedError, match="requires notification_id or reference"):
        provider._idempotency_key(notification_id=None, reference=None, recipient="+255712345678")


def test_idempotency_key_is_stable_for_the_same_notification():
    provider = _provider()
    key1 = provider._idempotency_key(notification_id="ntf-1", reference=None, recipient="+255712345678")
    key2 = provider._idempotency_key(notification_id="ntf-1", reference=None, recipient="+255712345678")
    assert key1 == key2 == "fixo:ntf-1:sms"


def test_idempotency_key_differs_across_notifications_to_the_same_number():
    """The exact collision this session's fix closed: two different
    outbox items sent to the same phone number must never share a key."""
    provider = _provider()
    key1 = provider._idempotency_key(notification_id="ntf-1", reference=None, recipient="+255712345678")
    key2 = provider._idempotency_key(notification_id="ntf-2", reference=None, recipient="+255712345678")
    assert key1 != key2


async def test_sms_uses_fixo_app_sender_id(monkeypatch):
    monkeypatch.setenv("SWALA_SMS_SENDER_ID", "FIXO APP")
    captured = {}

    class Response:
        status = 202

        def json(self):
            return {"data": {"uid": "provider-message-1"}}

    class Client:
        async def request(self, method, path, *, json_payload, headers):
            captured.update(json_payload)
            return Response()

    provider = SwalaSmsProvider(_provider().definition, client=cast(HttpClient, Client()))
    result = await provider.send_sms(to="+255712345678", text="Booking confirmed", notification_id="outbox-1")
    assert captured["sender_id"] == "FIXO APP"
    assert result["provider_message_uid"] == "provider-message-1"
