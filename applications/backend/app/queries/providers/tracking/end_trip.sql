-- PROV.TRIP.END — provider arrives / stops sharing location (Requirement Phase 18)
UPDATE "BOOKINGS"
   SET trip_ended_at = now(),
       updated_at = now()
 WHERE booking_id = CAST(:booking_id AS uuid)
   AND provider_id = CAST(:user_id AS uuid)
   AND trip_started_at IS NOT NULL
   AND trip_ended_at IS NULL
RETURNING booking_id, trip_ended_at;
