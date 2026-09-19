-- CUS.PAYMENT_METHOD.LIST
SELECT method_id, type, provider, details_masked, is_default, created_at, updated_at
FROM "PAYMENT_METHODS"
WHERE customer_id = CAST(:user_id AS uuid)
ORDER BY is_default DESC, created_at DESC
LIMIT :limit OFFSET :offset;