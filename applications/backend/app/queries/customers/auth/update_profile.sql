-- CUS.PROFILE.UPDATE
UPDATE "CUSTOMERS"
   SET full_name          = COALESCE(:full_name, full_name),
       phone              = COALESCE(:phone, phone),
       preferred_language = COALESCE(:preferred_language, preferred_language),
       updated_at         = now()
 WHERE customer_id = CAST(:user_id AS uuid)
RETURNING customer_id, full_name, phone, email, preferred_language;