-- NTF.DELIVERY_ATTEMPTS.FIND_BY_REFERENCE — locate the attempt a provider webhook callback refers to.
SELECT attempt_id, outbox_id, channel, provider_reference, status, attempt_no
FROM "NOTIFICATION_DELIVERY_ATTEMPTS"
WHERE channel = :channel AND provider_reference = :provider_reference
ORDER BY created_at DESC
LIMIT 1;
