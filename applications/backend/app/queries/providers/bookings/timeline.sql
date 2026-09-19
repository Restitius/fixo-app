-- PROV.BOOKING.TIMELINE -- chronological trail of a provider booking (Phase 16)
SELECT t.timeline_id, t.event, t.detail, t.created_at
  FROM "BOOKING_TIMELINE" t
  JOIN "BOOKINGS" b ON b.booking_id = t.booking_id
 WHERE b.booking_id = CAST(:booking_id AS uuid)
   AND b.provider_id = CAST(:user_id AS uuid)
 ORDER BY t.created_at;
