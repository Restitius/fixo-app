-- CUS.MAINTENANCE.FLAG_OVERDUE - flip due ACTIVE plans to OVERDUE.
-- Scheduler runs this before notifying so each plan is announced once.
UPDATE "MAINTENANCE_PLANS"
   SET status = 'OVERDUE', updated_at = now()
 WHERE status = 'ACTIVE'
   AND next_due_date < CURRENT_DATE
RETURNING plan_id, customer_id, plan_number;
