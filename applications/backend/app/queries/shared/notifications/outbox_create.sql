-- NTF.OUTBOX.CREATE — durable record of a notification to deliver.
INSERT INTO "NOTIFICATION_OUTBOX" (event_key, recipient_type, recipient_id, payload)
VALUES (:event_key, :recipient_type, CAST(:recipient_id AS uuid), CAST(:payload AS jsonb))
RETURNING outbox_id, created_at;
