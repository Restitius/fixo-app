-- PROV.AUTH.PROVIDER.BY_ID -- provider principal by id (authenticated /me)
SELECT provider_id, display_name, first_name, middle_name, last_name,
       email, phone, account_type, status, preferred_language,
       email_verified, phone_verified, verification_status,
       country, region, city, district, created_at
  FROM "PROVIDERS"
 WHERE provider_id = CAST(:user_id AS uuid);