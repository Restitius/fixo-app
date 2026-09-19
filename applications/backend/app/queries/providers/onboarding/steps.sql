-- PROV.ONBOARD.STEPS.LIST — catalogue of provider onboarding steps (Req Phase 2)
SELECT step_id, code, title, description, sort_order, is_required
  FROM "PROVIDER_ONBOARDING_STEPS"
 ORDER BY sort_order;