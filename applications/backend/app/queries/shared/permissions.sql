-- =============================================================================
-- QRY: SHARED.PERMISSIONS.EFFECTIVE
-- Purpose: Effective permission strings for a user across assigned roles.
-- Params:  user_id
-- Notes:   Wildcard '*' grants are resolved by security.permissions layer.
-- =============================================================================

SELECT DISTINCT p.permission_key
FROM user_roles AS ur
JOIN role_permissions AS rp ON rp.role_id = ur.role_id
JOIN permissions AS p ON p.permission_id = rp.permission_id
WHERE ur.user_id = :user_id;
