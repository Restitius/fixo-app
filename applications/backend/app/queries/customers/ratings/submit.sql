-- CUS.RATING.SUBMIT
WITH owned AS (
    SELECT b.booking_id, b.provider_id, b.customer_id
    FROM "BOOKINGS" b
    WHERE b.booking_id = CAST(:booking_id AS uuid)
      AND b.customer_id = CAST(:user_id AS uuid)
      AND b.status = 'CLOSED'
)
INSERT INTO "RATINGS" (booking_id, provider_id, customer_id, rating, comment)
SELECT o.booking_id, o.provider_id, o.customer_id, :rating, :comment
FROM owned o
ON CONFLICT (booking_id) DO UPDATE SET rating = EXCLUDED.rating, comment = EXCLUDED.comment, updated_at = NOW()
RETURNING rating_id, booking_id, provider_id, rating, comment, created_at;