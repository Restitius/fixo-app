-- CUS.AUTH.CUSTOMER.UPDATE_PASSWORD
UPDATE "CUSTOMERS"
   SET password_hash = :password_hash,
       updated_at    = now()
 WHERE customer_id = CAST(:user_id AS uuid)
RETURNING customer_id;
