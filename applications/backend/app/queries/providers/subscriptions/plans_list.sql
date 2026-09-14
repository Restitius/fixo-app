-- PROV.PLANS.LIST - public catalogue of active subscription plans
SELECT plan_id, code, name, description, price_monthly, max_team_members
FROM "PROVIDER_PLANS"
WHERE is_active = true
ORDER BY sort_order ASC;
