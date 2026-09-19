-- CUS.RATING.PROVIDER_STARS
SELECT AVG(r.rating)::NUMERIC(3,2) AS avg_rating, COUNT(r.rating) AS total_ratings
FROM "RATINGS" r
JOIN "BOOKINGS" b ON b.booking_id = r.booking_id
WHERE b.provider_id = CAST(:provider_id AS uuid);