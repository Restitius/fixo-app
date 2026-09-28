-- CUS.PROFILE.UPDATE
UPDATE "CUSTOMERS"
   SET full_name          = COALESCE(:full_name, full_name),
       phone_verified     = CASE WHEN CAST(:phone AS varchar) IS NOT NULL AND CAST(:phone AS varchar) <> phone THEN false ELSE phone_verified END,
       phone              = COALESCE(:phone, phone),
       preferred_language = COALESCE(:preferred_language, preferred_language),
       updated_at         = now()
 WHERE customer_id = CAST(:user_id AS uuid)
RETURNING customer_id, full_name, phone, email, preferred_language, phone_verified;