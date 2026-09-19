-- CUS.CHANGE.GET_OWNED — one change request owned through its booking.
SELECT c.change_id, c.booking_id, c.requested_by, c.change_type,
       c.current_value, c.proposed_value, c.reason, c.status,
       c.decided_at, c.created_at,
       c.new_work, c.additional_labour, c.additional_materials,
       c.additional_time_minutes, c.additional_price, c.currency,
       c.supporting_photos
  FROM "CHANGE_REQUESTS" c
  JOIN "BOOKINGS" b ON b.booking_id = c.booking_id
 WHERE c.change_id = CAST(:change_id AS uuid)
   AND b.customer_id = CAST(:customer_id AS uuid);