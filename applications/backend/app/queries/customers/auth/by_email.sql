-- CUS.AUTH.CUSTOMER.BY_EMAIL
SELECT customer_id, full_name, phone, email, password_hash,
       status, email_verified, phone_verified, preferred_language, created_at
  FROM "CUSTOMERS"
 WHERE email = :email;