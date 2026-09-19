-- CUS.ACTIVITY.LIST - cross-booking activity feed derived from timelines
SELECT b.booking_id, b.booking_number, s.name AS service_name,
       t.event, t.detail, t.created_at
FROM "BOOKING_TIMELINE" t
JOIN "BOOKINGS" b ON b.booking_id = t.booking_id
LEFT JOIN "SERVICES" s ON s.service_id = b.service_id
WHERE b.customer_id = CAST(:user_id AS uuid)
  AND (CAST(:event AS varchar) IS NULL OR t.event = :event)
ORDER BY t.created_at DESC
LIMIT :limit OFFSET :offset;
