-- PROV.AUTH.SESSION.GET_VALID -- live provider session by refresh token hash
SELECT s.session_id, s.provider_id, p.status
  FROM "PROVIDER_AUTH_SESSIONS" s
  JOIN "PROVIDERS" p ON p.provider_id = s.provider_id
 WHERE s.refresh_token_hash = :refresh_token_hash
   AND s.revoked_at IS NULL
   AND s.expires_at > now();