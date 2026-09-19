-- CUS.MAINTENANCE.DONE - service performed: stamp asset + advance the plan.
-- Atomic: lock the owned ACTIVE/OVERDUE plan, stamp last_serviced_at on the
-- asset, push next_due_date out by the interval and return to ACTIVE.
WITH owned AS (
    SELECT plan_id, asset_id, interval_days
      FROM "MAINTENANCE_PLANS"
     WHERE plan_id = CAST(:plan_id AS uuid)
       AND customer_id = CAST(:customer_id AS uuid)
       AND status IN ('ACTIVE', 'OVERDUE')
     FOR UPDATE
), asset_upd AS (
    UPDATE "ASSETS" a
       SET last_serviced_at = now(), updated_at = now()
      FROM owned o
     WHERE a.asset_id = o.asset_id
    RETURNING a.asset_id
), plan_upd AS (
    UPDATE "MAINTENANCE_PLANS" p
       SET last_done_at = now(),
           next_due_date = CURRENT_DATE + o.interval_days,
           status = 'ACTIVE',
           updated_at = now()
      FROM owned o
     WHERE p.plan_id = o.plan_id
    RETURNING p.plan_id, p.status, p.next_due_date
)
SELECT pu.plan_id, pu.status, pu.next_due_date
  FROM plan_upd pu JOIN asset_upd au ON true;
