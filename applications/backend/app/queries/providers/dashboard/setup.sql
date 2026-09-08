-- PRV.DASH.SETUP — account setup state feeding the attention list
SELECT
  (SELECT count(*) FROM "PROVIDER_ONBOARDING_STEPS" s
    WHERE s.is_required
      AND NOT EXISTS (SELECT 1 FROM "PROVIDER_ONBOARDING_PROGRESS" pr
                       WHERE pr.step_id = s.step_id
                         AND pr.provider_id = CAST(:user_id AS uuid)
                         AND pr.completed_at IS NOT NULL)) AS onboarding_incomplete,
  (SELECT verification_status FROM "PROVIDERS"
    WHERE provider_id = CAST(:user_id AS uuid)) AS verification_status,
  (SELECT count(*) FROM "PROVIDER_VERIFICATION_DOCUMENTS"
    WHERE provider_id = CAST(:user_id AS uuid)
      AND status = 'SUBMITTED') AS docs_awaiting_review,
  (SELECT count(*) FROM "PROVIDER_SERVICES"
    WHERE provider_id = CAST(:user_id AS uuid)
      AND status <> 'ARCHIVED') AS services_total,
  (SELECT count(*) FROM "PROVIDER_SERVICES"
    WHERE provider_id = CAST(:user_id AS uuid)
      AND status = 'APPROVED') AS services_approved,
  (SELECT count(*) FROM "PROVIDER_SERVICES" ps
    WHERE ps.provider_id = CAST(:user_id AS uuid)
      AND ps.status <> 'ARCHIVED'
      AND NOT EXISTS (SELECT 1 FROM "PROVIDER_SERVICE_PRICING" pp
                       WHERE pp.provider_id = ps.provider_id
                         AND pp.service_id = ps.service_id)) AS services_without_pricing,
  (SELECT count(*) FROM "PROVIDER_SERVICE_AREAS"
    WHERE provider_id = CAST(:user_id AS uuid) AND is_active) AS area_entries,
  (SELECT count(*) FROM "PROVIDER_WORKING_HOURS"
    WHERE provider_id = CAST(:user_id AS uuid) AND is_available) AS available_days,
  (SELECT a.is_online FROM "PROVIDER_AVAILABILITY_SETTINGS" a
    WHERE a.provider_id = CAST(:user_id AS uuid)) AS is_online,
  EXISTS (SELECT 1 FROM "PROVIDER_BUSINESS_PROFILES" bp
           WHERE bp.provider_id = CAST(:user_id AS uuid)) AS has_business_profile,
  (SELECT account_type FROM "PROVIDERS"
    WHERE provider_id = CAST(:user_id AS uuid)) AS account_type;