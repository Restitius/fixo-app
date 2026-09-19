-- CUS.LOYALTY.LIST_TRANSACTIONS - points ledger, newest first
SELECT points, running_total, activity, reference_id, created_at
FROM "LOYALTY_TRANSACTIONS"
WHERE customer_id = CAST(:user_id AS uuid)
ORDER BY created_at DESC
LIMIT :limit OFFSET :offset;
