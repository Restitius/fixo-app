-- An outbox item may be reclaimed after a worker crash; do not send its channel twice.
SELECT attempt_id, status
FROM "NOTIFICATION_DELIVERY_ATTEMPTS"
WHERE outbox_id = CAST(:outbox_id AS uuid) AND channel = :channel
ORDER BY created_at DESC
LIMIT 1;
