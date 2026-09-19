-- CUS.BOOKING.SET_SCHEDULE — apply an approved TIME change.
UPDATE "BOOKINGS"
   SET scheduled_date = CAST(:scheduled_date AS date),
       updated_at = now()
 WHERE booking_id = CAST(:booking_id AS uuid)
RETURNING booking_id, scheduled_date;