-- CUS.BOOKING.SET_ARRIVED — provider-side arrival (guarded from ON_THE_WAY).
UPDATE "BOOKINGS"
   SET status = 'ARRIVED',
       arrived_at = now(),
       updated_at = now()
 WHERE booking_id = CAST(:booking_id AS uuid)
   AND status = 'ON_THE_WAY'
RETURNING booking_id, arrived_at;