-- CUS.RECURRING.CREATE - subscribe to a repeating service.
INSERT INTO "RECURRING_SERVICES" (
    recurring_number, customer_id, service_id, address_id,
    frequency, next_run_date, time_window, instructions
) VALUES (
    'RC-' || to_char(now(), 'YYMMDDHH24MI') || '-' || upper(substr(md5(random()::text), 1, 4)),
    CAST(:customer_id AS uuid),
    CAST(:service_id AS uuid),
    CAST(:address_id AS uuid),
    :frequency, CAST(:next_run_date AS date), :time_window, :instructions
RETURNING recurring_id, recurring_number, frequency, next_run_date, status;
