-- PROV.TRIP.RECORD_LOCATION — append GPS trace to history (Requirement Phase 18)
INSERT INTO "PROVIDER_LOCATIONS" (booking_id, latitude, longitude)
VALUES (CAST(:booking_id AS uuid), CAST(:latitude AS numeric), CAST(:longitude AS numeric))
RETURNING location_id, recorded_at;
