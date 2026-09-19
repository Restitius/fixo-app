-- NTF.WEBHOOK_RECEIPTS.CREATE — durable, deduplicated record of an inbound delivery callback.
-- ON CONFLICT DO NOTHING makes a replayed callback a safe no-op.
INSERT INTO "WEBHOOK_RECEIPTS" (provider, message_id, event, payload)
VALUES (:provider, :message_id, :event, CAST(:payload AS jsonb))
ON CONFLICT (provider, message_id, event) DO NOTHING
RETURNING receipt_id;
