-- PROV.AUTH.PROVIDER.MARK_VERIFIED -- confirm email/phone flags
UPDATE "PROVIDERS"
   SET email_verified = :email_verified,
       phone_verified = :phone_verified,
       updated_at = now()
 WHERE provider_id = CAST(:user_id AS uuid)
RETURNING provider_id, email_verified, phone_verified;