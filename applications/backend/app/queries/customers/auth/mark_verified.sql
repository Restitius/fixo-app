-- CUS.AUTH.CUSTOMER.MARK_VERIFIED
UPDATE "CUSTOMERS"
   SET email_verified = email_verified OR :email_verified,
       phone_verified = phone_verified OR :phone_verified,
       updated_at     = now()
 WHERE customer_id = CAST(:user_id AS uuid)
RETURNING customer_id, email_verified, phone_verified;