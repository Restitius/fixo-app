-- CUS.SECURITY.SESSIONS.REVOKE_ALL
-- Revoke all active sessions; the session validation query checks this table
INSERT INTO "SESSION_REVOCATIONS" (customer_id, reason)
VALUES (CAST(:user_id AS uuid), :reason)
RETURNING revocation_id, reason, created_at;