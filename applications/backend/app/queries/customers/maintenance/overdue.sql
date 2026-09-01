-- CUS.MAINTENANCE.OVERDUE - scheduler feed: ACTIVE plans past their due date.
SELECT plan_id, customer_id, asset_id, service_id, plan_number, next_due_date
  FROM "MAINTENANCE_PLANS"
 WHERE status = 'ACTIVE'
   AND next_due_date < CURRENT_DATE
 ORDER BY next_due_date
 LIMIT CAST(:limit AS int);
