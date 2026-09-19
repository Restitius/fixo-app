-- CUS.MAINTENANCE.CREATE - plan recurring upkeep for an owned asset.
-- asset_id must belong to the same customer (WHERE EXISTS guard below) —
-- the FK alone only guarantees the asset exists, not that it's theirs.
INSERT INTO "MAINTENANCE_PLANS" (
    plan_number, customer_id, asset_id, service_id,
    interval_days, next_due_date, notes
)
SELECT
    'MP-' || to_char(now(), 'YYMMDDHH24MI') || '-' || upper(substr(md5(random()::text), 1, 4)),
    CAST(:customer_id AS uuid),
    CAST(:asset_id AS uuid),
    CAST(:service_id AS uuid),
    CAST(:interval_days AS int), CAST(:next_due_date AS date), :notes
 WHERE EXISTS (
    SELECT 1 FROM "ASSETS" a
     WHERE a.asset_id = CAST(:asset_id AS uuid)
       AND a.customer_id = CAST(:customer_id AS uuid)
       AND a.status <> 'ARCHIVED'
 )
RETURNING plan_id, plan_number, interval_days, next_due_date, status;
