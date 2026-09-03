-- CUS.AUTH.CUSTOMER.BY_ID_WITH_HASH — internal only (password_hash never
-- leaves the service layer). Do NOT return this row directly to a client;
-- CUS.AUTH.CUSTOMER.BY_ID is the public-facing equivalent without the hash.
SELECT customer_id, full_name, phone, email, password_hash,
       status, email_verified, phone_verified, preferred_language, created_at
  FROM "CUSTOMERS"
 WHERE customer_id = CAST(:user_id AS uuid);
