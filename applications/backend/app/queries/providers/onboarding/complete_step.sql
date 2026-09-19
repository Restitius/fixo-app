-- PROV.ONBOARD.STEP.COMPLETE — auto-save + mark one step completed (Req Phase 2)
INSERT INTO "PROVIDER_ONBOARDING_PROGRESS" (provider_id, step_id, step_data, completed_at, updated_at)
SELECT CAST(:user_id AS uuid), s.step_id, CAST(:step_data AS jsonb), now(), now()
  FROM "PROVIDER_ONBOARDING_STEPS" s
 WHERE s.code = :step_code
ON CONFLICT (provider_id, step_id) DO UPDATE
   SET step_data    = EXCLUDED.step_data,
       completed_at = COALESCE("PROVIDER_ONBOARDING_PROGRESS".completed_at, now()),
       updated_at   = now()
RETURNING provider_id, step_id, completed_at;