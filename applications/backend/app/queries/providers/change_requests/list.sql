-- PROV.CHANGE.LIST — change requests of a provider booking (Phase 23)
SELECT c.change_id, c.requested_by, c.change_type, c.current_value,
       c.proposed_value, c.reason, c.new_work, c.additional_labour,
       c.additional_materials, c.additional_time_minutes,
       c.additional_price, c.currency, c.supporting_photos,
       c.status, c.decided_at, c.created_at
  FROM "CHANGE_REQUESTS" c
  JOIN "BOOKINGS" b ON b.booking_id = c.booking_id
 WHERE c.booking_id  = CAST(:booking_id AS uuid)
   AND b.provider_id = CAST(:user_id AS uuid)
 ORDER BY c.created_at DESC;
