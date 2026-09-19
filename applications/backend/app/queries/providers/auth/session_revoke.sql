-- PROV.AUTH.SESSION.REVOKE -- revoke the used refresh token (rotation)
UPDATE "PROVIDER_AUTH_SESSIONS" SET revoked_at = now()
 WHERE refresh_token_hash = :refresh_token_hash
RETURNING session_id;