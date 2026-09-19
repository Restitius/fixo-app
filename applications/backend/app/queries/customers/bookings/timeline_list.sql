-- CUS.BOOKING.TIMELINE.LIST — chronological trail of an owned booking.
SELECT t.timeline_id, t.event, t.detail, t.created_at
  FROM "BOOKING_TIMELINE" t
  JOIN "BOOKINGS" b ON b.booking_id = t.booking_id
 WHERE b.booking_id = CAST(:booking_id AS uuid)
   AND b.customer_id = CAST(:customer_id AS uuid)
 ORDER BY t.created_at;