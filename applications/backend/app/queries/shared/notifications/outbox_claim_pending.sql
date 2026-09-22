-- NTF.OUTBOX.CLAIM_PENDING — atomically claim a batch of pending outbox rows
-- for processing (FOR UPDATE SKIP LOCKED keeps this safe under one worker
-- today and concurrent workers later without double-delivery).
WITH claimed AS (
    SELECT outbox_id
    FROM "NOTIFICATION_OUTBOX"
    WHERE status = 'pending'
       OR (status = 'processing' AND claimed_at < now() - interval '5 minutes')
    ORDER BY created_at
    LIMIT :batch
    FOR UPDATE SKIP LOCKED
)
UPDATE "NOTIFICATION_OUTBOX" o
SET status = 'processing', claimed_at = now()
FROM claimed c
WHERE o.outbox_id = c.outbox_id
RETURNING o.outbox_id, o.event_key, o.recipient_type, o.recipient_id, o.payload, o.created_at;
