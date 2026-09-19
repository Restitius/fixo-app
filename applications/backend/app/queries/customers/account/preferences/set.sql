-- CUS.PREFERENCE.SET
INSERT INTO "CUSTOMER_PREFERENCES" (customer_id, key, value)
VALUES (CAST(:user_id AS uuid), :key, :value)
ON CONFLICT (customer_id, key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()
RETURNING key, value, updated_at;