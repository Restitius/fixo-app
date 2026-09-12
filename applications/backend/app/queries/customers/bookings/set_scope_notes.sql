-- CUS.BOOKING.SET_SCOPE — apply an approved SCOPE change.
UPDATE "BOOKINGS"
   SET scope_notes = :scope_notes,
       updated_at = now()
 WHERE booking_id = CAST(:booking_id AS uuid)
RETURNING booking_id, scope_notes;
