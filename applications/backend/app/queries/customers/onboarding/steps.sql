-- CUS.ONBOARDING.STEPS.LIST â€” catalogue of all onboarding steps
SELECT step_id, code, title, description, sort_order, is_required
  FROM "ONBOARDING_STEPS"
 ORDER BY sort_order;