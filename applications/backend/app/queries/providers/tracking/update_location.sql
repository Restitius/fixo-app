-- PROV.TRIP.UPDATE_LOCATION — stream GPS position + ETA (Requirement Phase 18)
-- Writes the live snapshot on BOOKINGS and appends to PROVIDER_LOCATIONS history.
UPDATE "BOOKINGS"
   SET current_latitude = CAST(:latitude AS numeric),
       current_longitude = CAST(:longitude AS numeric),
       eta_minutes = CAST(:eta_minutes AS int),
       updated_at = now()
 WHERE booking_id = CAST(:booking_id AS uuid)
   AND provider_id = CAST(:user_id AS uuid)
   AND status = 'ON_THE_WAY'
RETURNING booking_id, current_latitude, current_longitude, eta_minutes;
