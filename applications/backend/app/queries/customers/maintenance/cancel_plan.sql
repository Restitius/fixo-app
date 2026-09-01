-- CUS.MAINTENANCE.CANCEL - cancel an owned ACTIVE/OVERDUE plan.
UPDATE "MAINTENANCE_PLANS"
   SET status = 'CANCELLED', updated_at = now()
 WHERE plan_id = CAST(:plan_id AS uuid)
   AND customer_id = CAST(:customer_id AS uuid)
   AND status IN ('ACTIVE', 'OVERDUE')
RETURNING plan_id, status;
