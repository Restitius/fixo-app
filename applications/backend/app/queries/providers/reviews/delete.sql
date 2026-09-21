-- PROV.REVIEW.DELETE -- provider removes its sign-off record from a booking (Phase 26)
DELETE FROM "BOOKING_JOB_REVIEWS"
 WHERE review_id = CAST(:review_id AS uuid)
   AND provider_id = CAST(:user_id AS uuid)
 RETURNING review_id, booking_id;
