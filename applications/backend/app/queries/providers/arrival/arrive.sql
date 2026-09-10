-- PROV.ARRIVAL.ARRIVE — provider records arrival with GPS (Requirement Phase 19).
UPDATE "BOOKINGS"
   SET status = 'ARRIVED',
       arrived_at = now(),
       arrival_latitude = CAST(:latitude AS numeric),
       arrival_longitude = CAST(:longitude AS numeric),
       updated_at = now()
 WHERE booking_id = CAST(:booking_id AS uuid)
   AND provider_id = CAST(:user_id AS uuid)
   AND status = 'ON_THE_WAY'
RETURNING booking_id, arrived_at, arrival_latitude, arrival_longitude;