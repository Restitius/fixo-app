-- PROV.TRIP.RECORD_LOCATION — append GPS trace to history (Requirement Phase 18)
-- booking_id must actually be this provider's own booking — the FK alone
-- doesn't check that, and without this guard any authenticated provider
-- could inject GPS points into another provider's trip history.
INSERT INTO "PROVIDER_LOCATIONS" (booking_id, latitude, longitude)
SELECT CAST(:booking_id AS uuid), CAST(:latitude AS numeric), CAST(:longitude AS numeric)
 WHERE EXISTS (
    SELECT 1 FROM "BOOKINGS" b
     WHERE b.booking_id = CAST(:booking_id AS uuid)
       AND b.provider_id = CAST(:user_id AS uuid)
 )
RETURNING location_id, recorded_at;
