-- CUS.BOOKING.TIMELINE.ADD — append one domain-owned history row.
INSERT INTO "BOOKING_TIMELINE" (booking_id, event, detail)
SELECT b.booking_id, :event, :detail
  FROM "BOOKINGS" b
 WHERE b.booking_id = CAST(:booking_id AS uuid)
   AND b.customer_id = CAST(:customer_id AS uuid)
RETURNING timeline_id;