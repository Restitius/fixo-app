-- CUS.BOOKING.UPDATE_AMOUNT — apply an approved PRICE change.
UPDATE "BOOKINGS"
   SET agreed_amount = :amount,
       updated_at = now()
 WHERE booking_id = CAST(:booking_id AS uuid)
RETURNING booking_id, agreed_amount;