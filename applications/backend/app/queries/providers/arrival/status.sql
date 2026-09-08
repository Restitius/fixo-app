-- PROV.ARRIVAL.STATUS — arrival state for a provider's booking (Requirement Phase 19).
SELECT booking_id, status, arrival_code, arrived_at, verified_at,
       arrival_latitude, arrival_longitude
  FROM "BOOKINGS"
 WHERE booking_id = CAST(:booking_id AS uuid)
   AND provider_id = CAST(:user_id AS uuid);