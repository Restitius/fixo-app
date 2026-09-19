-- CUS.TRACKING.SET_LOCATION — record a provider position ping for a booking.
INSERT INTO "PROVIDER_LOCATIONS" (booking_id, latitude, longitude)
SELECT b.booking_id, :latitude, :longitude
  FROM "BOOKINGS" b
 WHERE b.booking_id = CAST(:booking_id AS uuid)
RETURNING location_id, recorded_at;