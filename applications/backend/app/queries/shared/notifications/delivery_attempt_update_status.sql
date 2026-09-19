-- NTF.DELIVERY_ATTEMPTS.UPDATE_STATUS — reconcile an attempt after a send or a webhook callback.
-- provider_reference is COALESCEd so a caller that doesn't have one yet (e.g.
-- the initial post-send update, before a webhook confirms it) doesn't erase
-- a value set by an earlier call.
UPDATE "NOTIFICATION_DELIVERY_ATTEMPTS"
SET status = :status,
    failure_reason = :failure_reason,
    next_retry_at = :next_retry_at,
    provider_reference = COALESCE(:provider_reference, provider_reference)
WHERE attempt_id = CAST(:attempt_id AS uuid)
RETURNING attempt_id, outbox_id;
