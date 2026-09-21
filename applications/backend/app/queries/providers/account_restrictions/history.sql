-- PROV.ACCOUNT_RESTRICTIONS.HISTORY - the provider's full restriction history
SELECT restriction_id, restriction_type, reason, status, imposed_at,
       expires_at, lifted_at, lifted_reason
FROM "PROVIDER_ACCOUNT_RESTRICTIONS"
WHERE provider_id = CAST(:user_id AS uuid)
ORDER BY imposed_at DESC
LIMIT :limit OFFSET :offset;
