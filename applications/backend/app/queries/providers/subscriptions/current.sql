-- PROV.SUBSCRIPTIONS.CURRENT - the provider's active subscription + plan details
SELECT s.subscription_id, s.status, s.started_at, s.current_period_end,
       p.plan_id, p.code AS plan_code, p.name AS plan_name, p.price_monthly, p.max_team_members
FROM "PROVIDER_SUBSCRIPTIONS" s
JOIN "PROVIDER_PLANS" p ON p.plan_id = s.plan_id
WHERE s.provider_id = CAST(:user_id AS uuid)
  AND s.status = 'ACTIVE'
LIMIT 1;
