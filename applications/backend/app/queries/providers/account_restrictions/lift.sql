-- PROV.ACCOUNT_RESTRICTIONS.LIFT - platform/admin action: lift an active
-- restriction. Not exposed via any provider-facing endpoint in this phase.
UPDATE "PROVIDER_ACCOUNT_RESTRICTIONS"
SET status = 'LIFTED',
    lifted_at = now(),
    lifted_reason = :lifted_reason,
    updated_at = now()
WHERE restriction_id = CAST(:restriction_id AS uuid)
  AND status = 'ACTIVE'
RETURNING restriction_id, status, lifted_at, lifted_reason;
