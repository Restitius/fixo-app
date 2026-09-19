-- PROV.AUTH.PROVIDER.BY_ID_WITH_HASH — internal only (password_hash never
-- leaves the service layer). Do NOT return this row directly to a client;
-- PROV.AUTH.PROVIDER.BY_ID is the public-facing equivalent without the hash.
SELECT provider_id, display_name, email, phone, password_hash,
       status, email_verified, phone_verified, created_at
  FROM "PROVIDERS"
 WHERE provider_id = CAST(:user_id AS uuid);
