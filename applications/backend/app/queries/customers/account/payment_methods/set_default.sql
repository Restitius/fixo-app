-- CUS.PAYMENT_METHOD.SET_DEFAULT
-- Sequential statements: demote all then promote the chosen one (CTE snapshot fix)
UPDATE "PAYMENT_METHODS" SET is_default = FALSE
WHERE customer_id = CAST(:user_id AS uuid) AND is_default = TRUE;

UPDATE "PAYMENT_METHODS" SET is_default = TRUE
WHERE customer_id = CAST(:user_id AS uuid) AND method_id = CAST(:method_id AS uuid)
RETURNING method_id, type, provider, details_masked, is_default, created_at, updated_at;
