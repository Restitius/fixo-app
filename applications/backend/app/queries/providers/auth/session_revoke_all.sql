-- PROV.AUTH.SESSION.REVOKE_ALL -- logout / password reset: end all sessions
UPDATE "PROVIDER_AUTH_SESSIONS" SET revoked_at = now()
 WHERE provider_id = CAST(:user_id AS uuid)
   AND revoked_at IS NULL
RETURNING provider_id;