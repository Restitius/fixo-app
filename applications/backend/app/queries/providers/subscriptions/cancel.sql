-- PROV.SUBSCRIPTIONS.CANCEL - cancel the provider's active subscription
UPDATE "PROVIDER_SUBSCRIPTIONS"
SET status = 'CANCELLED',
    cancelled_at = now(),
    updated_at = now()
WHERE provider_id = CAST(:user_id AS uuid)
  AND status = 'ACTIVE'
RETURNING subscription_id, status, cancelled_at;
