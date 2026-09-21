-- PROV.AUTH.PROVIDER.BY_EMAIL -- resolve a provider principal for login/OTP
SELECT provider_id, display_name, email, phone, password_hash,
       status, account_type, preferred_language,
       email_verified, phone_verified, verification_status, created_at
  FROM "PROVIDERS"
 WHERE email = :email;