-- PROV.BOOKING.START_STATUS -- start-service state for a provider booking (Phase 20).
SELECT booking_id, status, started_at, timer_started_at,
       current_latitude, current_longitude
  FROM "BOOKINGS"
 WHERE booking_id = CAST(:booking_id AS uuid)
   AND provider_id = CAST(:user_id AS uuid);
