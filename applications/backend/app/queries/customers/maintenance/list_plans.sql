-- CUS.MAINTENANCE.LIST - the customer's plans with asset/service context.
SELECT p.plan_id, p.plan_number, p.asset_id, a.name AS asset_name,
       a.asset_code, a.asset_type, p.service_id, s.name AS service_name,
       p.interval_days, p.next_due_date, p.last_done_at, p.status
  FROM "MAINTENANCE_PLANS" p
  JOIN "ASSETS" a ON a.asset_id = p.asset_id
  JOIN "SERVICES" s ON s.service_id = p.service_id
 WHERE p.customer_id = CAST(:customer_id AS uuid)
 ORDER BY p.next_due_date ASC
 LIMIT CAST(:limit AS int) OFFSET CAST(:offset AS int);
