-- CUS.AUTH.SESSION.REVOKE â€” by token hash (logout / rotation)
UPDATE "AUTH_SESSIONS"
   SET revoked_at = now()
 WHERE refresh_token_hash = :refresh_token_hash
   AND revoked_at IS NULL
RETURNING session_id;