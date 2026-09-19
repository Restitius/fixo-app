-- PROV.SUBSCRIPTIONS.SUBSCRIBE - switch to a plan atomically: cancel any
-- current active subscription and start a new one, only if the target
-- plan is valid and active (the cancel is gated on that too, so an
-- invalid plan_id leaves the existing subscription untouched).
WITH target AS (
    SELECT plan_id FROM "PROVIDER_PLANS"
    WHERE plan_id = CAST(:plan_id AS uuid) AND is_active = true
),
cancel_existing AS (
    UPDATE "PROVIDER_SUBSCRIPTIONS" s
    SET status = 'CANCELLED', cancelled_at = now(), updated_at = now()
    WHERE s.provider_id = CAST(:provider_id AS uuid)
      AND s.status = 'ACTIVE'
      AND EXISTS (SELECT 1 FROM target)
    RETURNING s.subscription_id
)
INSERT INTO "PROVIDER_SUBSCRIPTIONS" (provider_id, plan_id)
-- The LEFT JOIN to cancel_existing is a deliberate data dependency, not
-- dead weight: without it, nothing in the final query references that
-- CTE, and Postgres does not guarantee its UPDATE runs before this
-- INSERT's constraint check — it can violate UQ_PROVIDER_SUBSCRIPTION_ACTIVE
-- even though the cancel "should" have made room for the new row.
SELECT CAST(:provider_id AS uuid), t.plan_id
FROM target t
LEFT JOIN cancel_existing c ON true
RETURNING subscription_id, plan_id, status, started_at;
