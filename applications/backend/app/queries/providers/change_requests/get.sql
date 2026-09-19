-- PROV.CHANGE.GET — one change request owned through the provider's booking (Phase 23)
SELECT c.change_id, c.booking_id, c.requested_by, c.change_type,
       c.current_value, c.proposed_value, c.reason, c.new_work,
       c.additional_labour, c.additional_materials,
       c.additional_time_minutes, c.additional_price, c.currency,
       c.supporting_photos, c.status, c.decided_at, c.created_at
  FROM "CHANGE_REQUESTS" c
  JOIN "BOOKINGS" b ON b.booking_id = c.booking_id
 WHERE c.change_id  = CAST(:change_id AS uuid)
   AND b.provider_id = CAST(:user_id AS uuid);
