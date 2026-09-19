-- CUS.AUTH.SESSION.LIST_FOR_CUSTOMER — this customer's own session history
SELECT session_id, device_info, ip_address, created_at, expires_at, revoked_at
  FROM "AUTH_SESSIONS"
 WHERE customer_id = CAST(:user_id AS uuid)
 ORDER BY created_at DESC
 LIMIT :limit;
