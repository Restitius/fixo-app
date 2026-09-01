-- Dispute on an OWNED booking
INSERT INTO "DISPUTES" (dispute_number, customer_id, booking_id, category, description)
SELECT
    'DSP-' || to_char(now(),'YYMMDDHH24MI') || '-' || upper(substr(md5(random()::text),1,4)),
    CAST(:customer_id AS uuid), CAST(:booking_id AS uuid), :category, :description
FROM "BOOKINGS" b
WHERE b.booking_id = CAST(:booking_id AS uuid)
  AND b.customer_id = CAST(:customer_id AS uuid)
RETURNING dispute_id, dispute_number, status, created_at;
