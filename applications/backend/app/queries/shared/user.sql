-- =============================================================================
-- QRY: SHARED.USER.BY_LOGIN
-- Purpose: Locate an ACTIVE user by username OR email (authentication entry).
-- Params:  login (username or email)
-- Security: pre-auth query; returns only safe identity columns.
-- =============================================================================

SELECT
    u.user_id,
    u.username,
    u.email,
    u.status,
    u.password_hash,
    u.failed_login_count,
    u.locked_until
FROM users AS u
WHERE (u.username = :login OR u.email = :login)
  AND u.status = 'ACTIVE';
