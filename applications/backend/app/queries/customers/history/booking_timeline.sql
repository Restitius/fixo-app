-- CUS.HISTORY.BOOKING_TIMELINE - chronological events of an owned booking
SELECT t.event, t.detail, t.created_at
FROM "BOOKING_TIMELINE" t
JOIN "BOOKINGS" b ON b.booking_id = t.booking_id
WHERE t.booking_id = CAST(:booking_id AS uuid)
  AND b.customer_id = CAST(:user_id AS uuid)
ORDER BY t.created_at ASC;
