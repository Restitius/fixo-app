-- CUS.PAYMENT_METHOD.ADD
INSERT INTO "PAYMENT_METHODS" (customer_id, type, provider, details_masked, is_default)
VALUES (CAST(:user_id AS uuid), :type, :provider, CAST(:details_masked AS JSONB), FALSE)
RETURNING method_id, type, provider, details_masked, is_default, created_at, updated_at;