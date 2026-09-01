-- CUS.CHANGE.GET_OWNED — one change request owned through its booking.
SELECT c.change_id, c.booking_id, c.requested_by, c.change_type,
       c.current_value, c.proposed_value, c.reason, c.status,
       c.decided_at, c.created_at
  FROM "CHANGE_REQUESTS" c
  JOIN "BOOKINGS" b ON b.booking_id = c.booking_id
 WHERE c.change_id = CAST(:change_id AS uuid)
   AND b.customer_id = CAST(:customer_id AS uuid);