-- CUS.SECURITY.PASSWORD.CHANGE
UPDATE "CUSTOMERS"
   SET password_hash = CAST(:new_hash AS TEXT),
       password_changed_at = now(),
       updated_at = now()
 WHERE customer_id = CAST(:user_id AS uuid)
   AND password_hash IS NOT NULL
RETURNING customer_id;