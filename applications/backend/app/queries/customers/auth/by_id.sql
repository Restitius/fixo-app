-- CUS.AUTH.CUSTOMER.BY_ID (ownership-scoped)
SELECT customer_id, full_name, phone, email,
       status, email_verified, phone_verified,
       preferred_language, created_at
  FROM "CUSTOMERS"
 WHERE customer_id = CAST(:user_id AS uuid);