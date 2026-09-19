-- CUS.REVIEW.CREATE.V1 - submit a review for an owned completed booking.
-- One review per booking (UNIQUE); re-submitting refreshes rating/comment.
INSERT INTO "REVIEWS" AS r (booking_id, customer_id, provider_id, rating, comment)
SELECT b.booking_id, b.customer_id, b.provider_id, CAST(:rating AS SMALLINT), :comment
  FROM "BOOKINGS" b
 WHERE b.booking_id = CAST(:booking_id AS uuid)
   AND b.customer_id = CAST(:customer_id AS uuid)
   AND b.status IN ('PAID', 'CLOSED', 'COMPLETED')
ON CONFLICT (booking_id) DO UPDATE
   SET rating = EXCLUDED.rating,
       comment = EXCLUDED.comment,
       updated_at = now()
RETURNING r.review_id, r.booking_id, r.rating, r.comment, r.status;
