-- PROV.AUTH.PROVIDER.UPDATE_PASSWORD -- set a new password hash
UPDATE "PROVIDERS"
   SET password_hash = :password_hash,
       updated_at = now()
 WHERE provider_id = CAST(:user_id AS uuid)
RETURNING provider_id;