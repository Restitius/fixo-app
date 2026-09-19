-- CUS.MAINTENANCE.GET - one owned plan.
SELECT p.plan_id, p.plan_number, p.asset_id, a.name AS asset_name, a.asset_code,
       p.service_id, s.name AS service_name, p.interval_days, p.next_due_date,
       p.last_done_at, p.status, p.notes
  FROM "MAINTENANCE_PLANS" p
  JOIN "ASSETS" a ON a.asset_id = p.asset_id
  JOIN "SERVICES" s ON s.service_id = p.service_id
 WHERE p.plan_id = CAST(:plan_id AS uuid)
   AND p.customer_id = CAST(:customer_id AS uuid);
