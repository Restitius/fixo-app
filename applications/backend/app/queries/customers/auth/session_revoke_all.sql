-- CUS.AUTH.SESSION.REVOKE_ALL — invalidate every active session for a customer.
UPDATE "AUTH_SESSIONS"
   SET revoked_at = now()
 WHERE customer_id = CAST(:user_id AS uuid)
   AND revoked_at IS NULL
RETURNING session_id;
