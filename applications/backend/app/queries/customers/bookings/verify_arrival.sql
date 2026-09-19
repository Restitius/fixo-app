-- CUS.BOOKING.VERIFY_ARRIVAL — customer confirms the 6-digit arrival code.
UPDATE "BOOKINGS"
   SET verified_at = now(),
       updated_at = now()
 WHERE booking_id = CAST(:booking_id AS uuid)
   AND customer_id = CAST(:customer_id AS uuid)
   AND status = 'ARRIVED'
   AND verified_at IS NULL
   AND arrival_code = :code
RETURNING booking_id, verified_at;