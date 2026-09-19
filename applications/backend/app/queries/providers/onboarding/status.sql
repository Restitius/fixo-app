-- PROV.ONBOARD.STATUS — steps with this provider's saved progress (Req Phase 2)
SELECT s.step_id, s.code, s.title, s.description, s.sort_order, s.is_required,
       (p.completed_at IS NOT NULL) AS completed,
       p.completed_at,
       COALESCE(p.step_data, '{}'::jsonb) AS step_data
  FROM "PROVIDER_ONBOARDING_STEPS" s
  LEFT JOIN "PROVIDER_ONBOARDING_PROGRESS" p
         ON p.step_id = s.step_id
        AND p.provider_id = CAST(:user_id AS uuid)
 ORDER BY s.sort_order;