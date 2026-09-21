-- NTF.DELIVERY_ATTEMPTS.CREATE — record one channel attempt for an outbox item.
INSERT INTO "NOTIFICATION_DELIVERY_ATTEMPTS"
    (outbox_id, channel, provider_reference, status, attempt_no, next_retry_at, failure_reason)
VALUES (
    CAST(:outbox_id AS uuid), :channel, :provider_reference, :status,
    :attempt_no, :next_retry_at, :failure_reason
)
RETURNING attempt_id, created_at;
