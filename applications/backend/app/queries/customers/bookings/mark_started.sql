-- CUS.BOOKING.MARK_STARTED — stamp execution start (guarded from ARRIVED).
UPDATE "BOOKINGS"
   SET status = 'STARTED',
       started_at = now(),
       updated_at = now()
 WHERE booking_id = CAST(:booking_id AS uuid)
   AND status = 'ARRIVED'
RETURNING booking_id, started_at;