-- PROV.TRIP.START — provider begins travel to customer (Requirement Phase 18)
UPDATE "BOOKINGS"
   SET status = 'ON_THE_WAY',
       trip_started_at = now(),
       updated_at = now()
 WHERE booking_id = CAST(:booking_id AS uuid)
   AND provider_id = CAST(:user_id AS uuid)
   AND status = 'CONFIRMED'
RETURNING booking_id, trip_started_at;
