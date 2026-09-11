-- PROV.REVIEW.SUBMIT — record the customer's sign-off / approval evidence
-- (Provider Phase 26). One approval record per booking (UNIQUE).
-- Guarded: only valid while the booking is in COMPLETION_REQUESTED.
-- The status transition COMPLETION_REQUESTED -> CUSTOMER_CONFIRMED is
-- owned by the customer-domain CompletionService; this query records
-- the approval evidence only.
WITH ins AS (
    INSERT INTO "BOOKING_JOB_REVIEWS"
           (booking_id, provider_id, customer_id, sign_off, approval_evidence)
    SELECT b.booking_id,
           b.provider_id,
           b.customer_id,
           CAST(:sign_off AS varchar),
           CAST(:approval_evidence AS varchar)
      FROM "BOOKINGS" b
     WHERE b.booking_id  = CAST(:booking_id AS uuid)
       AND b.provider_id = CAST(:user_id AS uuid)
       AND b.status      = 'COMPLETION_REQUESTED'
       AND NOT EXISTS (
           SELECT 1 FROM "BOOKING_JOB_REVIEWS" x
            WHERE x.booking_id = b.booking_id)
    RETURNING review_id, booking_id, provider_id, customer_id,
              sign_off, approval_evidence, signed_at, recorded_at
)
SELECT r.review_id, r.booking_id, r.provider_id, r.customer_id,
       r.sign_off, r.approval_evidence, r.signed_at, r.recorded_at,
       b.status AS booking_status
  FROM ins r
  JOIN "BOOKINGS" b ON b.booking_id = r.booking_id;
