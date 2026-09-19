-- CUS.TRACKING.LATEST — most recent known provider position + trail summary.
SELECT l.latitude, l.longitude, l.recorded_at,
       (SELECT count(*) FROM "PROVIDER_LOCATIONS" t
         WHERE t.booking_id = l.booking_id) AS ping_count
  FROM "PROVIDER_LOCATIONS" l
 WHERE l.booking_id = CAST(:booking_id AS uuid)
   AND EXISTS (
       SELECT 1 FROM "BOOKINGS" b
        WHERE b.booking_id = l.booking_id
          AND b.customer_id = CAST(:customer_id AS uuid)
   )
 ORDER BY l.recorded_at DESC
 LIMIT 1;