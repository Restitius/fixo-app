-- CUS.BOOKING.SET_STATUS — guarded workflow transition apply.
UPDATE "BOOKINGS"
   SET status = CAST(:to_state AS varchar),
       updated_at = now()
 WHERE booking_id = CAST(:booking_id AS uuid)
   AND customer_id = CAST(:customer_id AS uuid)
   AND status = CAST(:from_state AS varchar)
RETURNING booking_id, status;