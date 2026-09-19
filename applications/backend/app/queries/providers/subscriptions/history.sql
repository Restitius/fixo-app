-- PROV.SUBSCRIPTIONS.HISTORY - the provider's subscription history, newest first
SELECT s.subscription_id, s.status, s.started_at, s.current_period_end,
       s.cancelled_at, p.code AS plan_code, p.name AS plan_name
FROM "PROVIDER_SUBSCRIPTIONS" s
JOIN "PROVIDER_PLANS" p ON p.plan_id = s.plan_id
WHERE s.provider_id = CAST(:user_id AS uuid)
ORDER BY s.created_at DESC
LIMIT :limit OFFSET :offset;
