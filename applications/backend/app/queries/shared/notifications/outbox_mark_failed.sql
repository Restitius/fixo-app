-- NTF.OUTBOX.MARK_FAILED — outbox row could not be processed (unknown catalogue key, etc).
UPDATE "NOTIFICATION_OUTBOX"
SET status = 'failed'
WHERE outbox_id = CAST(:outbox_id AS uuid)
RETURNING outbox_id;
