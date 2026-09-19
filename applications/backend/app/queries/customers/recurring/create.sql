-- CUS.RECURRING.CREATE - subscribe to a repeating service.
-- address_id must belong to the same customer (WHERE EXISTS guard below) —
-- the FK alone only guarantees the address exists, not that it's theirs.
INSERT INTO "RECURRING_SERVICES" (
    recurring_number, customer_id, service_id, address_id,
    frequency, next_run_date, time_window, instructions
)
SELECT
    'RC-' || to_char(now(), 'YYMMDDHH24MI') || '-' || upper(substr(md5(random()::text), 1, 4)),
    CAST(:customer_id AS uuid),
    CAST(:service_id AS uuid),
    CAST(:address_id AS uuid),
    :frequency, CAST(:next_run_date AS date), :time_window, :instructions
 WHERE EXISTS (
    SELECT 1 FROM "CUSTOMER_ADDRESSES" a
     WHERE a.address_id = CAST(:address_id AS uuid)
       AND a.customer_id = CAST(:customer_id AS uuid)
 )
RETURNING recurring_id, recurring_number, frequency, next_run_date, status;
