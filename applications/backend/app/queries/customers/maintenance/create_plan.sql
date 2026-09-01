-- CUS.MAINTENANCE.CREATE - plan recurring upkeep for an owned asset.
INSERT INTO "MAINTENANCE_PLANS" (
    plan_number, customer_id, asset_id, service_id,
    interval_days, next_due_date, notes
) VALUES (
    'MP-' || to_char(now(), 'YYMMDDHH24MI') || '-' || upper(substr(md5(random()::text), 1, 4)),
    CAST(:customer_id AS uuid),
    CAST(:asset_id AS uuid),
    CAST(:service_id AS uuid),
    CAST(:interval_days AS int), CAST(:next_due_date AS date), :notes
RETURNING plan_id, plan_number, interval_days, next_due_date, status;
