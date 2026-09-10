-- PROV.CALENDAR.OVERLAP_CHECK -- detect overlapping bookings (Phase 15)
SELECT b.booking_id, b.booking_number, b.scheduled_date, b.time_window, b.status,
       s.name AS service_name, c.full_name AS customer_name
  FROM "BOOKINGS" b
  JOIN "SERVICES" s ON s.service_id = b.service_id
  JOIN "CUSTOMERS" c ON c.customer_id = b.customer_id
 WHERE b.provider_id = CAST(:user_id AS uuid)
   AND b.scheduled_date = CAST(:scheduled_date AS date)
   AND b.status IN ('CONFIRMED', 'PREPARING', 'TRAVELING', 'ARRIVED', 'WORK_STARTED')
   AND (:exclude_booking_id IS NULL OR b.booking_id != CAST(:exclude_booking_id AS uuid))
 ORDER BY b.scheduled_date;
