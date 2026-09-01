-- CUS.AUTH.SESSION.GET_VALID â€” live session by refresh token hash
SELECT s.session_id, s.customer_id, c.status
  FROM "AUTH_SESSIONS" s
  JOIN "CUSTOMERS" c ON c.customer_id = s.customer_id
 WHERE s.refresh_token_hash = :refresh_token_hash
   AND s.revoked_at IS NULL
   AND s.expires_at > now();