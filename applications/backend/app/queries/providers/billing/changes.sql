-- PROV.BILLING.CHANGES — approved change rows behind a provider bill (Phase 27)
SELECT c.change_id, c.change_type, c.reason,
       c.additional_labour, c.additional_materials,
       c.additional_time_minutes, c.additional_price, c.currency,
       c.decided_at
  FROM "CHANGE_REQUESTS" c
  JOIN "BOOKINGS" b ON b.booking_id = c.booking_id
 WHERE c.booking_id  = CAST(:booking_id AS uuid)
   AND b.provider_id = CAST(:user_id AS uuid)
   AND c.status = 'APPROVED'
 ORDER BY c.decided_at NULLS LAST, c.created_at;
