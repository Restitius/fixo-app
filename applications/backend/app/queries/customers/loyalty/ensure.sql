-- CUS.LOYALTY.ENSURE - provision the loyalty account when absent (idempotent)
INSERT INTO "LOYALTY_ACCOUNTS" (customer_id)
SELECT CAST(:user_id AS uuid)
WHERE NOT EXISTS (
    SELECT 1 FROM "LOYALTY_ACCOUNTS" WHERE customer_id = CAST(:user_id AS uuid)
)
RETURNING loyalty_id, points_balance, tier;
