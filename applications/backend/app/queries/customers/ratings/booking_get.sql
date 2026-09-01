-- CUS.RATING.BOOKING_GET
-- Returns the existing rating for a booking, or NULL if not yet rated
SELECT r.rating_id, r.booking_id, r.rating, r.comment, r.created_at
FROM "RATINGS" r
WHERE r.booking_id = CAST(:booking_id AS uuid)
LIMIT 1;