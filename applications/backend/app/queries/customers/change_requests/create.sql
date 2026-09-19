-- CUS.CHANGE.CREATE — propose a scope/time/price change on a booking.
INSERT INTO "CHANGE_REQUESTS" (booking_id, requested_by, change_type, current_value, proposed_value, reason)
SELECT b.booking_id, CAST(:requested_by AS varchar), :change_type,
       CAST(:current_value AS varchar), :proposed_value, :reason
  FROM "BOOKINGS" b
 WHERE b.booking_id = CAST(:booking_id AS uuid)
   AND b.customer_id = CAST(:customer_id AS uuid)
   AND b.status IN ('ARRIVED', 'STARTED', 'IN_PROGRESS', 'COMPLETION_REQUESTED')
RETURNING change_id, status, created_at;