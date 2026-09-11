-- PROV.REVIEW.GET — the sign-off / approval record for a provider booking
-- (Provider Phase 26). Provider-owned lookup.
SELECT r.review_id, r.booking_id, r.provider_id, r.customer_id,
       r.sign_off, r.approval_evidence, r.signed_at, r.recorded_at,
       b.status AS booking_status
  FROM "BOOKING_JOB_REVIEWS" r
  JOIN "BOOKINGS" b ON b.booking_id = r.booking_id
 WHERE r.provider_id = CAST(:user_id AS uuid)
   AND r.booking_id  = CAST(:booking_id AS uuid);
