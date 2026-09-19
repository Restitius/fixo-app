-- CUS.ONBOARDING.STATUS â€” steps with this customer's completion state
SELECT s.step_id, s.code, s.title, s.description, s.sort_order, s.is_required,
       (p.completed_at IS NOT NULL) AS completed,
       p.completed_at
  FROM "ONBOARDING_STEPS" s
  LEFT JOIN "CUSTOMER_ONBOARDING_PROGRESS" p
         ON p.step_id = s.step_id
        AND p.customer_id = CAST(:user_id AS uuid)
 ORDER BY s.sort_order;