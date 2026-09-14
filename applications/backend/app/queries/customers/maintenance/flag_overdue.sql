-- CUS.MAINTENANCE.FLAG_OVERDUE - flip due ACTIVE plans to OVERDUE.
-- Scheduler runs this before notifying so each plan is announced once.
-- Writes one NTF.MAINTENANCE.OVERDUE.V1 outbox row per newly-flagged plan,
-- atomically with the flag itself (a crash after this statement can never
-- flag a plan without also queuing its notification, or vice versa).
WITH upd AS (
    UPDATE "MAINTENANCE_PLANS"
       SET status = 'OVERDUE', updated_at = now()
     WHERE status = 'ACTIVE'
       AND next_due_date < CURRENT_DATE
    RETURNING plan_id, customer_id, plan_number
), outbox_ins AS (
    INSERT INTO "NOTIFICATION_OUTBOX" (event_key, recipient_type, recipient_id, payload)
    SELECT 'NTF.MAINTENANCE.OVERDUE.V1', 'customer', upd.customer_id,
           jsonb_build_object('plan_id', upd.plan_id, 'plan_number', upd.plan_number)
      FROM upd
    RETURNING outbox_id
)
SELECT upd.plan_id, upd.customer_id, upd.plan_number
  FROM upd
  LEFT JOIN (SELECT count(*) FROM outbox_ins) AS _outbox_forced ON true;
