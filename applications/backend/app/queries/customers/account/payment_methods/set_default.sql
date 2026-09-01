-- CUS.PAYMENT_METHOD.SET_DEFAULT
-- Single statement: a data-modifying CTE demotes the current default, then the
-- main UPDATE promotes the chosen one. asyncpg's prepared-statement protocol
-- rejects multiple semicolon-separated commands, so this must stay one statement.
WITH demoted AS (
    UPDATE "PAYMENT_METHODS" SET is_default = FALSE
    WHERE customer_id = CAST(:user_id AS uuid) AND is_default = TRUE
)
UPDATE "PAYMENT_METHODS" SET is_default = TRUE
WHERE customer_id = CAST(:user_id AS uuid) AND method_id = CAST(:method_id AS uuid)
RETURNING method_id, type, provider, details_masked, is_default, created_at, updated_at;
