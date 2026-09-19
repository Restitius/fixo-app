-- CUS.WARRANTY.CREATE.V1 - create a warranty for a closed booking.
-- Normally invoked by TR_BOOKING_WARRANTY; kept registered for backfills/support.
INSERT INTO "WARRANTIES" (booking_id, customer_id, provider_id, service_id,
                          status, expires_at, claim_deadline, terms)
SELECT b.booking_id, b.customer_id, b.provider_id, b.service_id,
       'ACTIVE',
       COALESCE(CAST(:expires_at AS timestamptz), now() + INTERVAL '90 days'),
       now() + INTERVAL '60 days',
       jsonb_build_object('coverage', 'parts_and_labor', 'duration_days', 90)
  FROM "BOOKINGS" b
 WHERE b.booking_id = CAST(:booking_id AS uuid)
   AND b.customer_id = CAST(:customer_id AS uuid)
ON CONFLICT (booking_id) DO NOTHING
RETURNING warranty_id, status, expires_at;
