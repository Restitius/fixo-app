-- Claim due channel retries so concurrent dispatchers do not send twice.
WITH due AS (
    SELECT attempt_id
    FROM "NOTIFICATION_DELIVERY_ATTEMPTS"
    WHERE (status = 'pending' AND next_retry_at <= now())
       OR (status = 'processing' AND updated_at < now() - interval '5 minutes')
    ORDER BY next_retry_at
    LIMIT :batch
    FOR UPDATE SKIP LOCKED
)
UPDATE "NOTIFICATION_DELIVERY_ATTEMPTS" a
SET status = 'processing', attempt_no = attempt_no + 1,
    next_retry_at = NULL, updated_at = now()
FROM due, "NOTIFICATION_OUTBOX" o
WHERE a.attempt_id = due.attempt_id AND o.outbox_id = a.outbox_id
RETURNING a.attempt_id, a.attempt_no, a.channel, a.outbox_id,
          o.event_key, o.recipient_type, o.recipient_id, o.payload;
