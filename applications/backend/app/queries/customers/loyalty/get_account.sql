-- CUS.LOYALTY.GET_ACCOUNT - points balance and tier
SELECT loyalty_id, points_balance, tier, updated_at
FROM "LOYALTY_ACCOUNTS"
WHERE customer_id = CAST(:user_id AS uuid)
LIMIT 1;
