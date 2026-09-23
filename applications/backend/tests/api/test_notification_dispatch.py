"""Notification dispatch contracts shared by the customer and provider apps."""

from typing import cast

import pytest

from app.platform.notifications.notification_manager import NotificationManager
from app.platform.query.sql_query_manager import SQLQueryManager
from app.registries.notifications.notification_registry import NotificationRegistry
from app.startup.register_notifications import register_notifications

LIFECYCLE_EVENTS = {
    "NTF.REQUEST.SUBMITTED.V1",
    "NTF.QUOTE.SUBMITTED.V1",
    "NTF.QUOTE.ACCEPTED.V1",
    "NTF.QUOTE.EXPIRED.V1",
    "NTF.BOOKING.CONFIRMED.V1",
    "NTF.BOOKING.ACKNOWLEDGED.V1",
    "NTF.PAYMENT.AUTHORIZED.V1",
    "NTF.PAYMENT.AUTHORIZATION_FAILED.V1",
    "NTF.BOOKING.ON_THE_WAY.V1",
    "NTF.BOOKING.ARRIVED.V1",
    "NTF.SERVICE.STARTED.V1",
    "NTF.CHANGE.PROPOSED.V1",
    "NTF.CHANGE.APPROVED.V1",
    "NTF.CHANGE.REJECTED.V1",
    "NTF.SERVICE.COMPLETION_REQUESTED.V1",
    "NTF.SERVICE.COMPLETED.V1",
    "NTF.BOOKING.CANCELLED.V1",
    "NTF.PAYMENT.CAPTURED.V1",
    "NTF.INVOICE.ISSUED.V1",
    "NTF.REVIEW.RECEIVED.V1",
    "NTF.VERIFICATION.APPROVED.V1",
    "NTF.VERIFICATION.REJECTED.V1",
}


def test_user_visible_lifecycle_is_registered_on_supported_channels():
    registry = NotificationRegistry()
    register_notifications(registry)

    assert LIFECYCLE_EVENTS <= set(registry.all_keys())
    for key in registry.all_keys():
        definition = registry.get(key)
        for recipient in definition.recipients:
            assert set(definition.channels_for(recipient)) <= {"database", "sms", "email"}


class RecordingSql:
    def __init__(self):
        self.calls = []
        self.retry_rows = []

    async def execute(self, query_id, params, *, fetch):
        self.calls.append((query_id, params))
        if query_id == "NTF.PROVIDER_LANGUAGE.GET":
            return {"preferred_language": "en", "phone": "+255712345678", "email": None}
        if query_id == "NTF.DELIVERY_ATTEMPTS.FIND_BY_CHANNEL":
            return None
        if query_id == "NTF.DELIVERY_ATTEMPTS.CREATE":
            return {"attempt_id": "attempt-1"}
        if query_id == "NTF.DELIVERY_ATTEMPTS.CLAIM_RETRY":
            return self.retry_rows
        if query_id == "PROV.SETTINGS.PREFERENCE.LIST":
            return [{"key": "NOTIFY_BOOKING_UPDATES_SMS", "value": "true"}]
        return None


@pytest.mark.asyncio
async def test_booking_provider_uses_shared_catalogue_and_inbox():
    registry = NotificationRegistry()
    register_notifications(registry)
    sql = RecordingSql()
    manager = NotificationManager(cast(SQLQueryManager, sql), notification_registry=registry)

    await manager._process_one(
        {
            "outbox_id": "outbox-1",
            "event_key": "NTF.BOOKING.CONFIRMED.V1",
            "recipient_type": "provider",
            "recipient_id": "provider-1",
            "payload": {"booking_id": "booking-1", "booking_number": "BK-1"},
        }
    )

    inbox = [params for query_id, params in sql.calls if query_id == "PROV.NOTIFICATIONS.CREATE"]
    assert len(inbox) == 1
    assert inbox[0]["outbox_id"] == "outbox-1"
    assert inbox[0]["title"] == "New booking assigned"


@pytest.mark.asyncio
async def test_failed_sms_is_retried_and_recorded_as_submitted():
    class Messaging:
        def __init__(self):
            self.calls = 0

        async def send_sms(self, phone, message, *, notification_id):
            self.calls += 1
            if self.calls == 1:
                raise RuntimeError("temporary gateway failure")
            return {"status": "QUEUED", "provider_message_uid": "sms-1"}

    registry = NotificationRegistry()
    register_notifications(registry)
    sql = RecordingSql()
    messaging = Messaging()
    manager = NotificationManager(
        cast(SQLQueryManager, sql), notification_registry=registry, messaging=messaging
    )
    definition = registry.get("NTF.BOOKING.CONFIRMED.V1")
    contact = {"phone": "+255712345678", "preferred_language": "en"}

    await manager._deliver_channel(
        "outbox-1",
        "sms",
        "provider",
        "provider-1",
        definition,
        contact,
        "New booking assigned",
        "Booking BK-1",
    )
    statuses = [
        params["status"]
        for query_id, params in sql.calls
        if query_id == "NTF.DELIVERY_ATTEMPTS.UPDATE_STATUS"
    ]
    assert statuses == ["pending"]

    sql.retry_rows = [
        {
            "attempt_id": "attempt-1",
            "attempt_no": 2,
            "channel": "sms",
            "outbox_id": "outbox-1",
            "event_key": "NTF.BOOKING.CONFIRMED.V1",
            "recipient_type": "provider",
            "recipient_id": "provider-1",
            "payload": {"booking_id": "booking-1", "booking_number": "BK-1"},
        }
    ]
    assert await manager.process_retries() == 1
    statuses = [
        params["status"]
        for query_id, params in sql.calls
        if query_id == "NTF.DELIVERY_ATTEMPTS.UPDATE_STATUS"
    ]
    assert statuses == ["pending", "submitted"]
    assert messaging.calls == 2
