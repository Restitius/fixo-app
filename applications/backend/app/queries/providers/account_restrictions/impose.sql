-- PROV.ACCOUNT_RESTRICTIONS.IMPOSE - platform/admin action: record a new
-- restriction on a provider account. Not exposed via any provider-facing
-- endpoint in this phase.
INSERT INTO "PROVIDER_ACCOUNT_RESTRICTIONS" (provider_id, restriction_type, reason, expires_at)
VALUES (CAST(:provider_id AS uuid), :restriction_type, :reason, :expires_at)
RETURNING restriction_id, provider_id, restriction_type, reason, status,
          imposed_at, expires_at, created_at;
