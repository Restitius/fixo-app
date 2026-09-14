-- NTF.OUTBOX.MARK_DISPATCHED — outbox row fully processed (all channels attempted).
UPDATE "NOTIFICATION_OUTBOX"
SET status = 'dispatched', dispatched_at = now()
WHERE outbox_id = CAST(:outbox_id AS uuid)
RETURNING outbox_id;
