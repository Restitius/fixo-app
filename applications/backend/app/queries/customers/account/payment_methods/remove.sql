-- CUS.PAYMENT_METHOD.REMOVE
-- Cannot delete the last/default method — service layer enforces
DELETE FROM "PAYMENT_METHODS"
WHERE method_id = CAST(:method_id AS uuid)
  AND customer_id = CAST(:user_id AS uuid)
  AND NOT is_default
  AND (SELECT COUNT(*) FROM "PAYMENT_METHODS" WHERE customer_id = CAST(:user_id AS uuid)) > 1
RETURNING method_id;