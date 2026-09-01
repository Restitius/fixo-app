-- CUS.BOOKING.MARK_COMPLETED — customer confirms completion (from CUSTOMER_CONFIRMED path).
UPDATE "BOOKINGS"
   SET status = 'CUSTOMER_CONFIRMED',
       completed_at = now(),
       updated_at = now()
 WHERE booking_id = CAST(:booking_id AS uuid)
   AND customer_id = CAST(:customer_id AS uuid)
   AND status = 'COMPLETION_REQUESTED'
RETURNING booking_id, completed_at;