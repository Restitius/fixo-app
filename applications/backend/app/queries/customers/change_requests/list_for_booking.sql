-- CUS.CHANGE.LIST — all change requests of one owned booking.
SELECT c.change_id, c.requested_by, c.change_type, c.current_value,
       c.proposed_value, c.reason, c.status, c.decided_at, c.created_at
  FROM "CHANGE_REQUESTS" c
  JOIN "BOOKINGS" b ON b.booking_id = c.booking_id
 WHERE c.booking_id = CAST(:booking_id AS uuid)
   AND b.customer_id = CAST(:customer_id AS uuid)
 ORDER BY c.created_at DESC;