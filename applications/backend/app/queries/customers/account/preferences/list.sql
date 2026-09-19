-- CUS.PREFERENCE.LIST
SELECT key, value, updated_at FROM "CUSTOMER_PREFERENCES"
WHERE customer_id = CAST(:user_id AS uuid)
ORDER BY key;