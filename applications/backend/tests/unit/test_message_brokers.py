from app.infrastructure.messaging.envelope import MessageEnvelope


def test_broker_envelope_has_stable_transport_metadata():
    envelope = MessageEnvelope(
        message_type="CMD.NOTIFICATION.DELIVER.V1",
        payload={"notification_id": "ntf-1", "message_id": "NTF.BOOKING.CONFIRMED.V1"},
        correlation_id="cor-1",
    ).to_dict()

    assert envelope["schema_version"] == 1
    assert envelope["message_id"].startswith("EVT-")
    assert envelope["correlation_id"] == "cor-1"
    assert envelope["payload"]["message_id"] == "NTF.BOOKING.CONFIRMED.V1"
