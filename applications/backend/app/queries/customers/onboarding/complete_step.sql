-- CUS.ONBOARDING.STEP.COMPLETE â€” idempotent completion of one step
INSERT INTO "CUSTOMER_ONBOARDING_PROGRESS" (customer_id, step_id)
SELECT CAST(:user_id AS uuid), s.step_id
  FROM "ONBOARDING_STEPS" s
 WHERE s.code = :step_code
ON CONFLICT (customer_id, step_id) DO NOTHING
RETURNING step_id;