-- PROV.ACCOUNT_RESTRICTIONS.LIST_ACTIVE - the provider's currently active restrictions
SELECT restriction_id, restriction_type, reason, status, imposed_at, expires_at
FROM "PROVIDER_ACCOUNT_RESTRICTIONS"
WHERE provider_id = CAST(:user_id AS uuid)
  AND status = 'ACTIVE'
ORDER BY imposed_at DESC;
